/**
 * Vault cryptographic operations.
 *
 * Ed25519→X25519 key conversion, XSalsa20-Poly1305 encrypt/decrypt,
 * vault key derivation, and secure memory zeroization.
 *
 * All crypto uses tweetnacl (already shipped with aim-core). Zero new deps.
 */
/**
 * Convert an Ed25519 public key (32 bytes) to an X25519 public key (32 bytes).
 *
 * Formula: u = (1 + y) / (1 - y) mod p
 * where y is the Edwards y-coordinate extracted from the Ed25519 public key.
 *
 * Ed25519 public key encoding: lower 255 bits = y coordinate, top bit = sign of x.
 */
export declare function ed25519PublicKeyToX25519(edPublicKey: Uint8Array): Uint8Array;
/**
 * Convert an Ed25519 secret key (64 bytes) to an X25519 secret key (32 bytes).
 *
 * Ed25519 secret key = 32-byte seed + 32-byte public key.
 * The X25519 secret key is derived by hashing the seed with SHA-512
 * and clamping the first 32 bytes (same as what NaCl does internally).
 */
export declare function ed25519SecretKeyToX25519(edSecretKey: Uint8Array): Uint8Array;
/**
 * Derive a vault encryption key from an Ed25519 keypair and an ephemeral X25519 public key.
 *
 * Uses X25519 ECDH: shared_secret = X25519(agent_x25519_secret, ephemeral_x25519_public)
 * The shared secret is used directly as the nacl.secretbox key (32 bytes).
 */
export declare function deriveVaultKey(edSecretKey: Uint8Array, ephemeralPublicKey: Uint8Array): Uint8Array;
/**
 * Generate an ephemeral X25519 keypair for vault key derivation.
 * The public key is stored alongside the vault; the secret key is used once
 * during init to derive the vault key, then zeroized.
 */
export declare function generateEphemeralKeypair(): {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
};
/**
 * Encrypt plaintext using XSalsa20-Poly1305 (nacl.secretbox).
 *
 * Returns { ciphertext, nonce } — both as Uint8Array.
 * Nonce is randomly generated (24 bytes).
 */
export declare function encrypt(plaintext: Uint8Array, key: Uint8Array): {
    ciphertext: Uint8Array;
    nonce: Uint8Array;
};
/**
 * Decrypt ciphertext using XSalsa20-Poly1305 (nacl.secretbox.open).
 *
 * Returns the plaintext or throws on failure (CR-006: fail closed).
 */
export declare function decrypt(ciphertext: Uint8Array, nonce: Uint8Array, key: Uint8Array): Uint8Array;
/**
 * Securely zeroize a Uint8Array to prevent credential material from lingering in memory.
 *
 * Overwrites with zeros. Not a guaranteed defense against all JIT/GC optimizations,
 * but significantly reduces the window of exposure.
 */
export declare function zeroize(data: Uint8Array): void;
//# sourceMappingURL=crypto.d.ts.map