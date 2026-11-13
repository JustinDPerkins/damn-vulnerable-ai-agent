import type { AuditEvent, AuditEventInput } from './types';
/**
 * Event aggregator — summarizes repeated events before reporting.
 * Groups events by (plugin, action, target, result) within a time window.
 * Flushes aggregated events when the window closes.
 */
export declare class EventAggregator {
    private readonly windowMs;
    private readonly buckets;
    private flushTimer;
    private onFlush;
    constructor(windowMs?: number);
    /** Set the flush callback (called with aggregated events) */
    setFlushHandler(handler: (events: AuditEvent[]) => void): void;
    /** Add an event to the aggregator */
    add(event: AuditEventInput): void;
    /** Start periodic flushing of expired windows */
    start(): void;
    /** Stop the aggregator and flush all pending buckets */
    stop(): AuditEvent[];
    /** Flush all expired buckets */
    flushExpired(): AuditEvent[];
    /** Flush all buckets regardless of expiry */
    flushAll(): AuditEvent[];
    /** Get current bucket count */
    getBucketCount(): number;
    private flushBucket;
}
//# sourceMappingURL=aggregator.d.ts.map