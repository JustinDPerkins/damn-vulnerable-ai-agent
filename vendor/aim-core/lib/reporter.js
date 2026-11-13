"use strict";
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
exports.AIMServerReporter = void 0;
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const QUEUE_FILE = 'report-queue.jsonl';
const MAX_BATCH_SIZE = 50;
const MAX_QUEUE_SIZE = 1000;
const FLUSH_INTERVAL_MS = 30000;
/**
 * AIM Server Reporter — batch POST audit events to a central server.
 * Includes offline queue: events are persisted to disk and flushed on reconnect.
 */
class AIMServerReporter {
    constructor(options) {
        this.queue = [];
        this.flushTimer = null;
        this.flushing = false;
        this.serverUrl = options.serverUrl.replace(/\/$/, '');
        this.agentId = options.agentId;
        this.dataDir = options.dataDir;
        this.apiToken = options.apiToken ?? '';
        this.maxBatchSize = options.maxBatchSize ?? MAX_BATCH_SIZE;
        this.flushIntervalMs = options.flushIntervalMs ?? FLUSH_INTERVAL_MS;
        // Load any persisted queue
        this.loadQueue();
    }
    /** Enqueue an event for reporting. Persists to disk for offline resilience. */
    enqueue(event) {
        this.queue.push(event);
        // Trim queue if it exceeds max size (drop oldest)
        if (this.queue.length > MAX_QUEUE_SIZE) {
            this.queue = this.queue.slice(-MAX_QUEUE_SIZE);
        }
        this.persistQueue();
        // Auto-flush when batch is full
        if (this.queue.length >= this.maxBatchSize) {
            void this.flush();
        }
    }
    /** Start the periodic flush timer */
    start() {
        if (this.flushTimer)
            return;
        this.flushTimer = setInterval(() => {
            void this.flush();
        }, this.flushIntervalMs);
        // Initial flush for any queued events
        if (this.queue.length > 0) {
            void this.flush();
        }
    }
    /** Stop the periodic flush timer and flush remaining events */
    async stop() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = null;
        }
        await this.flush();
    }
    /** Flush queued events to the server in batches */
    async flush() {
        if (this.flushing || this.queue.length === 0) {
            return { sent: 0, failed: 0, queued: this.queue.length };
        }
        this.flushing = true;
        let sent = 0;
        let failed = 0;
        try {
            while (this.queue.length > 0) {
                const batch = this.queue.slice(0, this.maxBatchSize);
                try {
                    await this.postBatch(batch);
                    // Remove sent events from queue
                    this.queue = this.queue.slice(batch.length);
                    sent += batch.length;
                }
                catch {
                    // Server unreachable — keep in queue for retry
                    failed += batch.length;
                    break;
                }
            }
            this.persistQueue();
        }
        finally {
            this.flushing = false;
        }
        return { sent, failed, queued: this.queue.length };
    }
    /** Get current queue length */
    getQueueLength() {
        return this.queue.length;
    }
    async postBatch(events) {
        const body = JSON.stringify({
            agentId: this.agentId,
            events,
        });
        return new Promise((resolve, reject) => {
            const url = new URL('/v1/audit/events', this.serverUrl);
            const isHttps = url.protocol === 'https:';
            const mod = isHttps ? https : http;
            const headers = {
                'Content-Type': 'application/json',
                'Content-Length': String(Buffer.byteLength(body)),
                'User-Agent': 'aim-core/reporter',
            };
            if (this.apiToken) {
                headers['Authorization'] = `Bearer ${this.apiToken}`;
            }
            const options = {
                hostname: url.hostname,
                port: url.port || (isHttps ? 443 : 80),
                path: url.pathname,
                method: 'POST',
                headers,
                timeout: 10000,
            };
            const req = mod.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    if (res.statusCode && res.statusCode < 400) {
                        resolve();
                    }
                    else {
                        reject(new Error(`Server returned ${res.statusCode}: ${data.slice(0, 200)}`));
                    }
                });
            });
            req.on('error', reject);
            req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
            req.write(body);
            req.end();
        });
    }
    persistQueue() {
        try {
            fs.mkdirSync(this.dataDir, { recursive: true });
            const queuePath = path.join(this.dataDir, QUEUE_FILE);
            const content = this.queue.map((e) => JSON.stringify(e)).join('\n');
            fs.writeFileSync(queuePath, content + (content ? '\n' : ''), 'utf-8');
        }
        catch {
            // Persistence is best-effort
        }
    }
    loadQueue() {
        try {
            const queuePath = path.join(this.dataDir, QUEUE_FILE);
            if (!fs.existsSync(queuePath))
                return;
            const content = fs.readFileSync(queuePath, 'utf-8').trim();
            if (!content)
                return;
            const lines = content.split('\n').filter(Boolean);
            this.queue = lines.map((line) => JSON.parse(line));
        }
        catch {
            this.queue = [];
        }
    }
}
exports.AIMServerReporter = AIMServerReporter;
//# sourceMappingURL=reporter.js.map