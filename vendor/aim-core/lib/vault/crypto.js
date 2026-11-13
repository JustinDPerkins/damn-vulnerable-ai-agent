"use strict";
/**
 * Vault cryptographic operations.
 *
 * Ed25519→X25519 key conversion, XSalsa20-Poly1305 encrypt/decrypt,
 * vault key derivation, and secure memory zeroization.
 *
 * All crypto uses tweetnacl (already shipped with aim-core). Zero new deps.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ed25519PublicKeyToX25519 = ed25519PublicKeyToX25519;
exports.ed25519SecretKeyToX25519 = ed25519SecretKeyToX25519;
exports.deriveVaultKey = deriveVaultKey;
exports.generateEphemeralKeypair = generateEphemeralKeypair;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.zeroize = zeroize;
const nacl = __importStar(require("tweetnacl"));
// ── Ed25519→X25519 conversion ──────────────────────────────────────
//
// Ed25519 keys live on the twisted Edwards curve.
// X25519 keys live on the Montgomery curve.
// Birational equivalence: u = (1 + y) / (1 - y) mod p
//
// We implement this using nacl.lowlevel Galois field operations
// so we don't need any new dependencies.
// tweetnacl ships lowlevel GF ops at runtime but the published types
// don't declare them. Cast once here; typed via NaclLowlevel interface.
const ll = nacl.lowlevel;
const gf = ll.gf;
/** Compute a^(-1) mod p using Fermat's little theorem: a^(p-2) mod p */
function inv25519(o, a) {
    const c = gf();
    for (let i = 0; i < 16; i++)
        c[i] = a[i];
    for (let i = 253; i >= 0; i--) {
        ll.S(c, c);
        if (i !== 2 && i !== 4)
            ll.M(c, c, a);
    }
    for (let i = 0; i < 16; i++)
        o[i] = c[i];
}
/**
 * Convert an Ed25519 public key (32 bytes) to an X25519 public key (32 bytes).
 *
 * Formula: u = (1 + y) / (1 - y) mod p
 * where y is the Edwards y-coordinate extracted from the Ed25519 public key.
 *
 * Ed25519 public key encoding: lower 255 bits = y coordinate, top bit = sign of x.
 */
function ed25519PublicKeyToX25519(edPublicKey) {
    if (edPublicKey.length !== 32) {
        throw new Error('Ed25519 public key must be 32 bytes');
    }
    // Extract y coordinate: clear the sign bit (top bit of byte 31)
    const yBytes = new Uint8Array(32);
    yBytes.set(edPublicKey);
    yBytes[31] &= 0x7f;
    const y = gf();
    const one = gf();
    const num = gf(); // 1 + y
    const den = gf(); // 1 - y
    const denInv = gf();
    const u = gf();
    ll.unpack25519(y, yBytes);
    // num = 1 + y
    ll.set25519(one, gf([1]));
    ll.A(num, one, y);
    // den = 1 - y
    ll.Z(den, one, y);
    // denInv = den^(-1) mod p
    inv25519(denInv, den);
    // u = num * denInv = (1 + y) / (1 - y) mod p
    ll.M(u, num, denInv);
    // Pack the result into 32 bytes
    const result = new Uint8Array(32);
    ll.pack25519(result, u);
    return result;
}
/**
 * Convert an Ed25519 secret key (64 bytes) to an X25519 secret key (32 bytes).
 *
 * Ed25519 secret key = 32-byte seed + 32-byte public key.
 * The X25519 secret key is derived by hashing the seed with SHA-512
 * and clamping the first 32 bytes (same as what NaCl does internally).
 */
function ed25519SecretKeyToX25519(edSecretKey) {
    if (edSecretKey.length !== 64) {
        throw new Error('Ed25519 secret key must be 64 bytes');
    }
    // Hash the 32-byte seed (first half of Ed25519 secret key)
    const seed = edSecretKey.subarray(0, 32);
    const hash = nacl.hash(seed); // SHA-512, returns 64 bytes
    // Clamp the first 32 bytes for X25519
    const x25519Key = new Uint8Array(32);
    x25519Key.set(hash.subarray(0, 32));
    // X25519 clamping
    x25519Key[0] &= 248;
    x25519Key[31] &= 127;
    x25519Key[31] |= 64;
    return x25519Key;
}
/**
 * Derive a vault encryption key from an Ed25519 keypair and an ephemeral X25519 public key.
 *
 * Uses X25519 ECDH: shared_secret = X25519(agent_x25519_secret, ephemeral_x25519_public)
 * The shared secret is used directly as the nacl.secretbox key (32 bytes).
 */
function deriveVaultKey(edSecretKey, ephemeralPublicKey) {
    const x25519Secret = ed25519SecretKeyToX25519(edSecretKey);
    try {
        const sharedSecret = nacl.box.before(ephemeralPublicKey, x25519Secret);
        return sharedSecret; // 32-byte key for nacl.secretbox
    }
    finally {
        zeroize(x25519Secret);
    }
}
/**
 * Generate an ephemeral X25519 keypair for vault key derivation.
 * The public key is stored alongside the vault; the secret key is used once
 * during init to derive the vault key, then zeroized.
 */
function generateEphemeralKeypair() {
    return nacl.box.keyPair();
}
/**
 * Encrypt plaintext using XSalsa20-Poly1305 (nacl.secretbox).
 *
 * Returns { ciphertext, nonce } — both as Uint8Array.
 * Nonce is randomly generated (24 bytes).
 */
function encrypt(plaintext, key) {
    if (key.length !== 32) {
        throw new Error('Encryption key must be 32 bytes');
    }
    const nonce = nacl.randomBytes(24);
    const ciphertext = nacl.secretbox(plaintext, nonce, key);
    return { ciphertext, nonce };
}
/**
 * Decrypt ciphertext using XSalsa20-Poly1305 (nacl.secretbox.open).
 *
 * Returns the plaintext or throws on failure (CR-006: fail closed).
 */
function decrypt(ciphertext, nonce, key) {
    if (key.length !== 32) {
        throw new Error('Decryption key must be 32 bytes');
    }
    if (nonce.length !== 24) {
        throw new Error('Nonce must be 24 bytes');
    }
    const plaintext = nacl.secretbox.open(ciphertext, nonce, key);
    if (plaintext === null) {
        throw new Error('Decryption failed: authentication tag mismatch (tampered or wrong key)');
    }
    return plaintext;
}
/**
 * Securely zeroize a Uint8Array to prevent credential material from lingering in memory.
 *
 * Overwrites with zeros. Not a guaranteed defense against all JIT/GC optimizations,
 * but significantly reduces the window of exposure.
 */
function zeroize(data) {
    data.fill(0);
}
//# sourceMappingURL=crypto.js.map