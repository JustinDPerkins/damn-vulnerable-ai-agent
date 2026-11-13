export declare const VERSION = "0.2.0";
export type { AIMCoreOptions, AIMIdentity, StoredIdentity, AuditEvent, AuditEventInput, AuditReadOptions, CapabilityPolicy, CapabilityRule, TrustScore, TrustFactors, TrustHints, } from './types';
export { sign, verify } from './crypto';
export { createIdentity, loadIdentity, getOrCreateIdentity } from './identity';
export { logEvent, readAuditLog, hasAuditLog } from './audit';
export { loadPolicy, savePolicy, checkCapability, hasPolicy } from './policy';
export { calculateTrust } from './trust';
export { scanText, maskMetadata, ALL_PATTERNS, PII_PATTERNS, SECRET_PATTERNS, mask, maskAll, getDLPAction, defaultDLPPolicy, type DLPPattern, type DLPMatch, type DLPScanResult, type DLPPolicy, } from './dlp';
export { AIMServerReporter, type ReporterOptions } from './reporter';
export { EventAggregator } from './aggregator';
export * as vault from './vault';
import type { AIMCoreOptions, AIMIdentity, AuditEvent, AuditEventInput, AuditReadOptions, CapabilityPolicy, TrustScore, TrustHints } from './types';
import { VaultStore } from './vault/store';
/**
 * Main entry point for aim-core.
 *
 * Provides Ed25519 identity, local audit logging, capability policy enforcement,
 * trust scoring, and cryptographic signing — all without a server or database.
 */
export declare class AIMCore {
    private readonly agentName;
    private readonly dataDir;
    private readonly serverUrl;
    private cachedPolicy;
    private trustHints;
    private reporter;
    private aggregator;
    constructor(options: AIMCoreOptions);
    /** Get or create the agent's Ed25519 identity */
    getIdentity(): AIMIdentity;
    /** Alias for getIdentity() — matches documented API */
    getOrCreateIdentity(): AIMIdentity;
    /** Check if a capability is allowed by the current policy */
    checkCapability(capability: string, plugin?: string): boolean;
    /** Load capability policy from YAML file or inline shorthand */
    loadPolicy(inline?: {
        allow?: string[];
        deny?: string[];
        default?: 'allow' | 'deny';
    }): CapabilityPolicy;
    /** Save a capability policy to YAML file */
    savePolicy(p: CapabilityPolicy): void;
    /** Log an audit event to the local JSON-lines file and route to reporter */
    logEvent(event: AuditEventInput & {
        outcome?: 'allowed' | 'denied' | 'error';
    }): AuditEvent;
    /** Read audit events from local log */
    readAuditLog(options?: AuditReadOptions): AuditEvent[];
    /** Calculate the agent's trust score based on current state */
    calculateTrust(): TrustScore;
    /** Provide hints from plugins to improve trust score accuracy */
    setTrustHints(hints: TrustHints): void;
    /** Sign data with the agent's Ed25519 private key */
    sign(data: Uint8Array): Uint8Array;
    /** Verify an Ed25519 signature against a public key (accepts base64 string or Uint8Array) */
    verify(data: Uint8Array, signature: Uint8Array, publicKey: Uint8Array | string): boolean;
    /** Enable server reporting — batch POST audit events to AIM server */
    enableReporting(options?: {
        apiToken?: string;
        flushIntervalMs?: number;
    }): void;
    /** Enable event aggregation — summarize repeated events before reporting */
    enableAggregation(windowMs?: number): void;
    /** Stop reporter and aggregator, flush remaining events */
    shutdown(): Promise<void>;
    /** Get the data directory path */
    getDataDir(): string;
    /**
     * Get a VaultStore instance for this agent's vault.
     * The vault directory is at ~/.aim/vault/ (separate from the data dir).
     */
    getVault(): VaultStore;
    private defaultDataDir;
}
//# sourceMappingURL=index.d.ts.map