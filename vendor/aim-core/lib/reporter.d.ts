import type { AuditEvent } from './types';
export interface ReporterOptions {
    /** AIM server URL (e.g., https://aim.example.invalid) */
    serverUrl: string;
    /** Agent ID for authentication */
    agentId: string;
    /** Data directory for offline queue persistence */
    dataDir: string;
    /** Optional API token */
    apiToken?: string;
    /** Flush interval in ms (default: 30s) */
    flushIntervalMs?: number;
    /** Max events per batch (default: 50) */
    maxBatchSize?: number;
}
/**
 * AIM Server Reporter — batch POST audit events to a central server.
 * Includes offline queue: events are persisted to disk and flushed on reconnect.
 */
export declare class AIMServerReporter {
    private readonly serverUrl;
    private readonly agentId;
    private readonly dataDir;
    private readonly apiToken;
    private readonly maxBatchSize;
    private readonly flushIntervalMs;
    private queue;
    private flushTimer;
    private flushing;
    constructor(options: ReporterOptions);
    /** Enqueue an event for reporting. Persists to disk for offline resilience. */
    enqueue(event: AuditEvent): void;
    /** Start the periodic flush timer */
    start(): void;
    /** Stop the periodic flush timer and flush remaining events */
    stop(): Promise<void>;
    /** Flush queued events to the server in batches */
    flush(): Promise<{
        sent: number;
        failed: number;
        queued: number;
    }>;
    /** Get current queue length */
    getQueueLength(): number;
    private postBatch;
    private persistQueue;
    private loadQueue;
}
//# sourceMappingURL=reporter.d.ts.map