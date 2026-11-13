"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventAggregator = void 0;
/**
 * Event aggregator — summarizes repeated events before reporting.
 * Groups events by (plugin, action, target, result) within a time window.
 * Flushes aggregated events when the window closes.
 */
class EventAggregator {
    constructor(windowMs = 60000) {
        this.buckets = new Map();
        this.flushTimer = null;
        this.onFlush = null;
        this.windowMs = windowMs;
    }
    /** Set the flush callback (called with aggregated events) */
    setFlushHandler(handler) {
        this.onFlush = handler;
    }
    /** Add an event to the aggregator */
    add(event) {
        const key = `${event.plugin}|${event.action}|${event.target}|${event.result}`;
        const now = Date.now();
        let bucket = this.buckets.get(key);
        if (!bucket || now - bucket.windowStart > this.windowMs) {
            // Flush old bucket if it exists
            if (bucket) {
                this.flushBucket(key, bucket);
            }
            bucket = {
                windowStart: now,
                count: 0,
                firstEvent: event,
                lastTimestamp: new Date().toISOString(),
            };
            this.buckets.set(key, bucket);
        }
        bucket.count++;
        bucket.lastTimestamp = new Date().toISOString();
    }
    /** Start periodic flushing of expired windows */
    start() {
        if (this.flushTimer)
            return;
        this.flushTimer = setInterval(() => {
            this.flushExpired();
        }, this.windowMs);
    }
    /** Stop the aggregator and flush all pending buckets */
    stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        return this.flushAll();
    }
    /** Flush all expired buckets */
    flushExpired() {
        const now = Date.now();
        const flushed = [];
        for (const [key, bucket] of this.buckets.entries()) {
            if (now - bucket.windowStart > this.windowMs) {
                const events = this.flushBucket(key, bucket);
                flushed.push(...events);
                this.buckets.delete(key);
            }
        }
        return flushed;
    }
    /** Flush all buckets regardless of expiry */
    flushAll() {
        const flushed = [];
        for (const [key, bucket] of this.buckets.entries()) {
            const events = this.flushBucket(key, bucket);
            flushed.push(...events);
        }
        this.buckets.clear();
        return flushed;
    }
    /** Get current bucket count */
    getBucketCount() {
        return this.buckets.size;
    }
    flushBucket(key, bucket) {
        const event = {
            timestamp: bucket.lastTimestamp,
            plugin: bucket.firstEvent.plugin,
            action: bucket.firstEvent.action,
            target: bucket.firstEvent.target,
            result: bucket.firstEvent.result,
            metadata: {
                ...bucket.firstEvent.metadata,
                aggregated: bucket.count > 1,
                count: bucket.count,
                windowStartedAt: new Date(bucket.windowStart).toISOString(),
            },
        };
        const events = [event];
        if (this.onFlush) {
            this.onFlush(events);
        }
        return events;
    }
}
exports.EventAggregator = EventAggregator;
//# sourceMappingURL=aggregator.js.map