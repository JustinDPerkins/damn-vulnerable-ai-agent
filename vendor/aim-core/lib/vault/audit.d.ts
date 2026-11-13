/**
 * Vault audit logging.
 *
 * Append-only JSONL log of all vault operations — resolve, store, rotate,
 * delete, revoke, etc. Reuses the rotation pattern from the existing audit.ts.
 *
 * Every vault operation (success or failure) must produce an audit entry.
 */
import type { VaultAuditEvent, VaultAuditEventInput, VaultAuditReadOptions } from './types';
/**
 * Log a vault audit event to the append-only JSONL file.
 *
 * @returns The complete event with timestamp
 */
export declare function logVaultEvent(vaultDir: string, event: VaultAuditEventInput): VaultAuditEvent;
/**
 * Read vault audit events from the JSONL log.
 *
 * Supports filtering by limit, since timestamp, and namespace.
 */
export declare function readVaultAudit(vaultDir: string, options?: VaultAuditReadOptions): VaultAuditEvent[];
//# sourceMappingURL=audit.d.ts.map