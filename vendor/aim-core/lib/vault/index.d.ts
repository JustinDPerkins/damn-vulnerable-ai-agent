export type { VaultNamespace, VaultFile, EncryptedBlob, VaultResolutionRequest, VaultResolutionResult, VaultAuditEvent, VaultAuditEventInput, VaultAuditReadOptions, VaultOperation, NamespaceStatus, VaultAuditOperation, } from './types';
export { ed25519PublicKeyToX25519, ed25519SecretKeyToX25519, deriveVaultKey, generateEphemeralKeypair, encrypt, decrypt, zeroize, } from './crypto';
export { VaultStore } from './store';
export { createNamespace, listNamespaces, getNamespace, updateNamespace, revokeNamespace, type CreateNamespaceOptions, type UpdateNamespaceOptions, } from './namespaces';
export { logVaultEvent, readVaultAudit } from './audit';
export { createResolutionRequest, resolveWithPolicy, type ResolutionContext, } from './resolution';
//# sourceMappingURL=index.d.ts.map