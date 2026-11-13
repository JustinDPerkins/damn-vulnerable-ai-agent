import type { AuditEvent, AuditEventInput, AuditReadOptions } from './types';
/** Append an audit event to the JSON-lines log */
export declare function logEvent(dataDir: string, event: AuditEventInput): AuditEvent;
/** Read audit events from the JSON-lines log */
export declare function readAuditLog(dataDir: string, options?: AuditReadOptions): AuditEvent[];
/** Check if the audit log exists and has entries */
export declare function hasAuditLog(dataDir: string): boolean;
//# sourceMappingURL=audit.d.ts.map