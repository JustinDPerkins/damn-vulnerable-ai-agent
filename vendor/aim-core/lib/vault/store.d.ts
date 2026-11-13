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
export declare class VaultStore {
    private readonly vaultDir;
    private readonly vaultPath;
    private vaultKey;
    constructor(vaultDir: string);
    /**
     * Initialize a new vault for the given agent identity.
     * Creates the vault directory and an empty encrypted vault file.
     *
     * @param agentId - The agent's unique identifier
     * @param edSecretKey - The agent's Ed25519 secret key (64 bytes)
     */
    init(agentId: string, edSecretKey: Uint8Array): void;
    /** Check if the vault file exists */
    exists(): boolean;
    /**
     * Unlock the vault by deriving the vault key from the agent's Ed25519 secret key.
     * Must be called before any read/write operations on an existing vault.
     */
    unlock(edSecretKey: Uint8Array): void;
    /**
     * Store a credential in the vault under a namespace.
     * The credential is encrypted independently with the vault key.
     *
     * @param namespace - Namespace identifier
     * @param credential - Raw credential bytes (will be encrypted, then zeroized)
     */
    storeCredential(namespace: string, credential: Uint8Array): void;
    /**
     * Resolve (decrypt) a credential from the vault.
     *
     * CR-006: Throws on failure — never returns partial data or falls back.
     *
     * @returns Decrypted credential bytes. Caller MUST zeroize after use.
     */
    resolveCredential(namespace: string): Uint8Array;
    /**
     * List all credential namespaces in the vault.
     * Returns metadata only — no credential values.
     */
    listCredentials(): Array<{
        namespace: string;
        version: number;
        encryptedAt: string;
    }>;
    /**
     * Delete a credential from the vault.
     *
     * @returns true if the credential existed and was deleted
     */
    deleteCredential(namespace: string): boolean;
    /**
     * Rotate a credential — store new value, increment version.
     *
     * @param namespace - Namespace to rotate
     * @param newCredential - New credential bytes (will be encrypted, then zeroized)
     */
    rotateCredential(namespace: string, newCredential: Uint8Array): void;
    /** Get the agent ID from the vault file */
    getAgentId(): string;
    /**
     * Destroy the vault — zeroize in-memory key, delete vault file.
     * This is irreversible.
     */
    destroy(): void;
    /** Lock the vault — zeroize the in-memory key */
    lock(): void;
    private ensureUnlocked;
    private readVaultFile;
    private decryptBlob;
    /** Atomic write: write to tmp file, then rename */
    private atomicWrite;
}
//# sourceMappingURL=store.d.ts.map