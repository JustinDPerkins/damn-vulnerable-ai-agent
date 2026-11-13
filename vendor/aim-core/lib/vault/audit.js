"use strict";
/**
 * Vault audit logging.
 *
 * Append-only JSONL log of all vault operations — resolve, store, rotate,
 * delete, revoke, etc. Reuses the rotation pattern from the existing audit.ts.
 *
 * Every vault operation (success or failure) must produce an audit entry.
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
exports.logVaultEvent = logVaultEvent;
exports.readVaultAudit = readVaultAudit;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const VAULT_AUDIT_FILE = 'vault-audit.jsonl';
const MAX_AUDIT_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_ROTATED_LOGS = 5;
/**
 * Log a vault audit event to the append-only JSONL file.
 *
 * @returns The complete event with timestamp
 */
function logVaultEvent(vaultDir, event) {
    const fullEvent = {
        timestamp: new Date().toISOString(),
        ...event,
    };
    fs.mkdirSync(vaultDir, { recursive: true });
    const filePath = path.join(vaultDir, VAULT_AUDIT_FILE);
    // Rotate if log exceeds size limit
    try {
        const stat = fs.statSync(filePath);
        if (stat.size > MAX_AUDIT_SIZE) {
            const suffix = `${Date.now()}.${process.pid}.${crypto.randomBytes(4).toString('hex')}`;
            try {
                fs.renameSync(filePath, `${filePath}.${suffix}`);
            }
            catch {
                // Another process may have rotated
            }
            // Clean up old rotated logs
            try {
                const dir = path.dirname(filePath);
                const base = path.basename(filePath);
                const rotated = fs.readdirSync(dir)
                    .filter((f) => f.startsWith(base + '.') && f !== base)
                    .sort()
                    .reverse();
                for (const old of rotated.slice(MAX_ROTATED_LOGS)) {
                    try {
                        fs.unlinkSync(path.join(dir, old));
                    }
                    catch { /* best-effort */ }
                }
            }
            catch { /* best-effort */ }
        }
    }
    catch {
        // File doesn't exist yet
    }
    fs.appendFileSync(filePath, JSON.stringify(fullEvent) + '\n', 'utf-8');
    return fullEvent;
}
/**
 * Read vault audit events from the JSONL log.
 *
 * Supports filtering by limit, since timestamp, and namespace.
 */
function readVaultAudit(vaultDir, options) {
    const filePath = path.join(vaultDir, VAULT_AUDIT_FILE);
    if (!fs.existsSync(filePath)) {
        return [];
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const lines = raw.trim().split('\n').filter(Boolean);
    let events = lines.map((line) => JSON.parse(line));
    if (options?.since) {
        const sinceTime = new Date(options.since).getTime();
        events = events.filter((e) => new Date(e.timestamp).getTime() > sinceTime);
    }
    if (options?.namespace) {
        events = events.filter((e) => e.namespace === options.namespace);
    }
    if (options?.limit && options.limit > 0) {
        events = events.slice(-options.limit);
    }
    return events;
}
//# sourceMappingURL=audit.js.map