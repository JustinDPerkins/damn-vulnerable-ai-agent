/**
 * Vault credential resolution with policy enforcement.
 *
 * Implements the local vault resolution flow (simplified 8-step from the spec):
 * 1. Verify Ed25519 signature
 * 2. (ATC check — skipped in local-only mode)
 * 3. Load namespace, verify status + operation
 * 4. Check capability (vault:resolve:<namespace>)
 * 5. Retrieve encrypted blob from VaultStore
 * 6. Decrypt with vault key
 * 7. (Zeroize — caller responsibility)
 * 8. Write audit entry
 *
 * CR-001: credential never in agent context
 * CR-002: Ed25519 signature required
 * CR-003: capability check before release
 * CR-006: fail closed
 */
import type { VaultResolutionRequest, VaultResolutionResult, VaultOperation } from './types';
import { VaultStore } from './store';
/**
 * Create a signed resolution request.
 *
 * The agent signs `namespace|operation|nonce` with its Ed25519 secret key.
 * This proves the resolution request came from the agent that owns the vault.
 */
export declare function createResolutionRequest(namespace: string, operation: VaultOperation, agentId: string, edSecretKey: Uint8Array): VaultResolutionRequest;
export interface ResolutionContext {
    /** Vault directory path */
    vaultDir: string;
    /** Unlocked VaultStore instance */
    store: VaultStore;
    /** Agent's Ed25519 public key (32 bytes) */
    edPublicKey: Uint8Array;
    /** Capability checker: returns true if the agent has the required capability */
    checkCapability?: (capability: string) => boolean;
}
/**
 * Resolve a credential with full policy enforcement.
 *
 * Performs the local vault resolution flow:
 * 1. Verify Ed25519 signature over request payload
 * 2. Check nonce freshness (replay protection)
 * 3. Load namespace, verify active + operation allowed
 * 4. Check capability if checker provided
 * 5. Decrypt credential from vault
 * 6. Log audit event (always — success or failure)
 *
 * @returns VaultResolutionResult with decrypted credential on success.
 *          Caller MUST zeroize the credential after use.
 */
export declare function resolveWithPolicy(request: VaultResolutionRequest, context: ResolutionContext): VaultResolutionResult;
//# sourceMappingURL=resolution.d.ts.map