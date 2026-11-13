"use strict";
/**
 * VaultStore — encrypted credential storage.
 *
 * Manages ~/.aim/vault/ on disk. Each credential is independently encrypted
 * per-namespace using XSalsa20-Poly1305 with a key derived from the agent's
 * Ed25519 identity via X25519 ECDH.
 *
 * CR-001: credential never in agent context
 * CR-005: zero plaintext on disk
 * CR-006: fail closed
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
exports.VaultStore = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto_1 = require("./crypto");
const VAULT_FILE = 'vault.enc';
class VaultStore {
    constructor(vaultDir) {
        this.vaultKey = null;
        this.vaultDir = vaultDir;
        this.vaultPath = path.join(vaultDir, VAULT_FILE);
    }
    /**
     * Initialize a new vault for the given agent identity.
     * Creates the vault directory and an empty encrypted vault file.
     *
     * @param agentId - The agent's unique identifier
     * @param edSecretKey - The agent's Ed25519 secret key (64 bytes)
     */
    init(agentId, edSecretKey) {
        if (this.exists()) {
            throw new Error('Vault already initialized at ' + this.vaultDir);
        }
        // Generate ephemeral X25519 keypair for vault key derivation
        const ephKp = (0, crypto_1.generateEphemeralKeypair)();
        // Derive vault key via ECDH
        this.vaultKey = (0, crypto_1.deriveVaultKey)(edSecretKey, ephKp.publicKey);
        // Zeroize ephemeral secret key — only the public key is stored
        (0, crypto_1.zeroize)(ephKp.secretKey);
        const vaultFile = {
            formatVersion: 1,
            agentId,
            ephemeralPublicKey: Buffer.from(ephKp.publicKey).toString('base64'),
            credentials: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        fs.mkdirSync(this.vaultDir, { recursive: true });
        this.atomicWrite(vaultFile);
        // Set restrictive permissions
        try {
            fs.chmodSync(this.vaultPath, 0o600);
            fs.chmodSync(this.vaultDir, 0o700);
        }
        catch {
            // Windows doesn't support chmod
        }
    }
    /** Check if the vault file exists */
    exists() {
        return fs.existsSync(this.vaultPath);
    }
    /**
     * Unlock the vault by deriving the vault key from the agent's Ed25519 secret key.
     * Must be called before any read/write operations on an existing vault.
     */
    unlock(edSecretKey) {
        const vaultFile = this.readVaultFile();
        const ephPub = Buffer.from(vaultFile.ephemeralPublicKey, 'base64');
        this.vaultKey = (0, crypto_1.deriveVaultKey)(edSecretKey, new Uint8Array(ephPub));
    }
    /**
     * Store a credential in the vault under a namespace.
     * The credential is encrypted independently with the vault key.
     *
     * @param namespace - Namespace identifier
     * @param credential - Raw credential bytes (will be encrypted, then zeroized)
     */
    storeCredential(namespace, credential) {
        this.ensureUnlocked();
        const { ciphertext, nonce } = (0, crypto_1.encrypt)(credential, this.vaultKey);
        const vaultFile = this.readVaultFile();
        const existingVersion = vaultFile.credentials[namespace]?.version ?? 0;
        vaultFile.credentials[namespace] = {
            ciphertext: Buffer.from(ciphertext).toString('base64'),
            nonce: Buffer.from(nonce).toString('base64'),
            algorithm: 'xsalsa20-poly1305',
            version: existingVersion + 1,
            encryptedAt: new Date().toISOString(),
        };
        vaultFile.updatedAt = new Date().toISOString();
        this.atomicWrite(vaultFile);
    }
    /**
     * Resolve (decrypt) a credential from the vault.
     *
     * CR-006: Throws on failure — never returns partial data or falls back.
     *
     * @returns Decrypted credential bytes. Caller MUST zeroize after use.
     */
    resolveCredential(namespace) {
        this.ensureUnlocked();
        const vaultFile = this.readVaultFile();
        const blob = vaultFile.credentials[namespace];
        if (!blob) {
            throw new Error(`No credential found for namespace "${namespace}"`);
        }
        return this.decryptBlob(blob);
    }
    /**
     * List all credential namespaces in the vault.
     * Returns metadata only — no credential values.
     */
    listCredentials() {
        const vaultFile = this.readVaultFile();
        return Object.entries(vaultFile.credentials).map(([ns, blob]) => ({
            namespace: ns,
            version: blob.version,
            encryptedAt: blob.encryptedAt,
        }));
    }
    /**
     * Delete a credential from the vault.
     *
     * @returns true if the credential existed and was deleted
     */
    deleteCredential(namespace) {
        const vaultFile = this.readVaultFile();
        if (!(namespace in vaultFile.credentials)) {
            return false;
        }
        delete vaultFile.credentials[namespace];
        vaultFile.updatedAt = new Date().toISOString();
        this.atomicWrite(vaultFile);
        return true;
    }
    /**
     * Rotate a credential — store new value, increment version.
     *
     * @param namespace - Namespace to rotate
     * @param newCredential - New credential bytes (will be encrypted, then zeroized)
     */
    rotateCredential(namespace, newCredential) {
        this.ensureUnlocked();
        const vaultFile = this.readVaultFile();
        const existing = vaultFile.credentials[namespace];
        if (!existing) {
            throw new Error(`Cannot rotate: no credential found for namespace "${namespace}"`);
        }
        const { ciphertext, nonce } = (0, crypto_1.encrypt)(newCredential, this.vaultKey);
        vaultFile.credentials[namespace] = {
            ciphertext: Buffer.from(ciphertext).toString('base64'),
            nonce: Buffer.from(nonce).toString('base64'),
            algorithm: 'xsalsa20-poly1305',
            version: existing.version + 1,
            encryptedAt: new Date().toISOString(),
        };
        vaultFile.updatedAt = new Date().toISOString();
        this.atomicWrite(vaultFile);
    }
    /** Get the agent ID from the vault file */
    getAgentId() {
        return this.readVaultFile().agentId;
    }
    /**
     * Destroy the vault — zeroize in-memory key, delete vault file.
     * This is irreversible.
     */
    destroy() {
        if (this.vaultKey) {
            (0, crypto_1.zeroize)(this.vaultKey);
            this.vaultKey = null;
        }
        if (fs.existsSync(this.vaultPath)) {
            fs.unlinkSync(this.vaultPath);
        }
    }
    /** Lock the vault — zeroize the in-memory key */
    lock() {
        if (this.vaultKey) {
            (0, crypto_1.zeroize)(this.vaultKey);
            this.vaultKey = null;
        }
    }
    // ── Private helpers ─────────────────────────────────────────────
    ensureUnlocked() {
        if (!this.vaultKey) {
            throw new Error('Vault is locked. Call unlock() or init() first.');
        }
    }
    readVaultFile() {
        if (!fs.existsSync(this.vaultPath)) {
            throw new Error('Vault not found at ' + this.vaultPath);
        }
        const raw = fs.readFileSync(this.vaultPath, 'utf-8');
        return JSON.parse(raw);
    }
    decryptBlob(blob) {
        const ciphertext = new Uint8Array(Buffer.from(blob.ciphertext, 'base64'));
        const nonce = new Uint8Array(Buffer.from(blob.nonce, 'base64'));
        return (0, crypto_1.decrypt)(ciphertext, nonce, this.vaultKey);
    }
    /** Atomic write: write to tmp file, then rename */
    atomicWrite(vaultFile) {
        const tmpPath = this.vaultPath + '.tmp.' + process.pid;
        fs.writeFileSync(tmpPath, JSON.stringify(vaultFile, null, 2), 'utf-8');
        try {
            fs.chmodSync(tmpPath, 0o600);
        }
        catch {
            // Windows
        }
        fs.renameSync(tmpPath, this.vaultPath);
    }
}
exports.VaultStore = VaultStore;
//# sourceMappingURL=store.js.map