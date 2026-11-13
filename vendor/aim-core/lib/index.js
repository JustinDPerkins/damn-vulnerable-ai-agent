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
exports.AIMCore = exports.vault = exports.EventAggregator = exports.AIMServerReporter = exports.defaultDLPPolicy = exports.getDLPAction = exports.maskAll = exports.mask = exports.SECRET_PATTERNS = exports.PII_PATTERNS = exports.ALL_PATTERNS = exports.maskMetadata = exports.scanText = exports.calculateTrust = exports.hasPolicy = exports.checkCapability = exports.savePolicy = exports.loadPolicy = exports.hasAuditLog = exports.readAuditLog = exports.logEvent = exports.getOrCreateIdentity = exports.loadIdentity = exports.createIdentity = exports.verify = exports.sign = exports.VERSION = void 0;
exports.VERSION = '0.2.0';
// Re-export module functions for advanced usage
var crypto_1 = require("./crypto");
Object.defineProperty(exports, "sign", { enumerable: true, get: function () { return crypto_1.sign; } });
Object.defineProperty(exports, "verify", { enumerable: true, get: function () { return crypto_1.verify; } });
var identity_1 = require("./identity");
Object.defineProperty(exports, "createIdentity", { enumerable: true, get: function () { return identity_1.createIdentity; } });
Object.defineProperty(exports, "loadIdentity", { enumerable: true, get: function () { return identity_1.loadIdentity; } });
Object.defineProperty(exports, "getOrCreateIdentity", { enumerable: true, get: function () { return identity_1.getOrCreateIdentity; } });
var audit_1 = require("./audit");
Object.defineProperty(exports, "logEvent", { enumerable: true, get: function () { return audit_1.logEvent; } });
Object.defineProperty(exports, "readAuditLog", { enumerable: true, get: function () { return audit_1.readAuditLog; } });
Object.defineProperty(exports, "hasAuditLog", { enumerable: true, get: function () { return audit_1.hasAuditLog; } });
var policy_1 = require("./policy");
Object.defineProperty(exports, "loadPolicy", { enumerable: true, get: function () { return policy_1.loadPolicy; } });
Object.defineProperty(exports, "savePolicy", { enumerable: true, get: function () { return policy_1.savePolicy; } });
Object.defineProperty(exports, "checkCapability", { enumerable: true, get: function () { return policy_1.checkCapability; } });
Object.defineProperty(exports, "hasPolicy", { enumerable: true, get: function () { return policy_1.hasPolicy; } });
var trust_1 = require("./trust");
Object.defineProperty(exports, "calculateTrust", { enumerable: true, get: function () { return trust_1.calculateTrust; } });
// DLP module
var dlp_1 = require("./dlp");
Object.defineProperty(exports, "scanText", { enumerable: true, get: function () { return dlp_1.scanText; } });
Object.defineProperty(exports, "maskMetadata", { enumerable: true, get: function () { return dlp_1.maskMetadata; } });
Object.defineProperty(exports, "ALL_PATTERNS", { enumerable: true, get: function () { return dlp_1.ALL_PATTERNS; } });
Object.defineProperty(exports, "PII_PATTERNS", { enumerable: true, get: function () { return dlp_1.PII_PATTERNS; } });
Object.defineProperty(exports, "SECRET_PATTERNS", { enumerable: true, get: function () { return dlp_1.SECRET_PATTERNS; } });
Object.defineProperty(exports, "mask", { enumerable: true, get: function () { return dlp_1.mask; } });
Object.defineProperty(exports, "maskAll", { enumerable: true, get: function () { return dlp_1.maskAll; } });
Object.defineProperty(exports, "getDLPAction", { enumerable: true, get: function () { return dlp_1.getDLPAction; } });
Object.defineProperty(exports, "defaultDLPPolicy", { enumerable: true, get: function () { return dlp_1.defaultDLPPolicy; } });
// Server reporter
var reporter_1 = require("./reporter");
Object.defineProperty(exports, "AIMServerReporter", { enumerable: true, get: function () { return reporter_1.AIMServerReporter; } });
// Event aggregation
var aggregator_1 = require("./aggregator");
Object.defineProperty(exports, "EventAggregator", { enumerable: true, get: function () { return aggregator_1.EventAggregator; } });
// Vault module — identity-native encrypted credential storage
exports.vault = __importStar(require("./vault"));
const identity = __importStar(require("./identity"));
const audit = __importStar(require("./audit"));
const policy = __importStar(require("./policy"));
const trust = __importStar(require("./trust"));
const crypto = __importStar(require("./crypto"));
const reporter_2 = require("./reporter");
const aggregator_2 = require("./aggregator");
const store_1 = require("./vault/store");
/**
 * Main entry point for aim-core.
 *
 * Provides Ed25519 identity, local audit logging, capability policy enforcement,
 * trust scoring, and cryptographic signing — all without a server or database.
 */
class AIMCore {
    constructor(options) {
        this.cachedPolicy = null;
        this.trustHints = {};
        this.reporter = null;
        this.aggregator = null;
        this.agentName = options.agentName;
        this.dataDir = options.dataDir ?? this.defaultDataDir();
        this.serverUrl = options.serverUrl ?? '';
    }
    /** Get or create the agent's Ed25519 identity */
    getIdentity() {
        return identity.getOrCreateIdentity(this.dataDir, this.agentName);
    }
    /** Alias for getIdentity() — matches documented API */
    getOrCreateIdentity() {
        return this.getIdentity();
    }
    /** Check if a capability is allowed by the current policy */
    checkCapability(capability, plugin) {
        if (!this.cachedPolicy) {
            this.cachedPolicy = policy.loadPolicy(this.dataDir);
        }
        return policy.checkCapability(this.cachedPolicy, capability, plugin);
    }
    /** Load capability policy from YAML file or inline shorthand */
    loadPolicy(inline) {
        if (inline) {
            const rules = [];
            if (inline.allow) {
                for (const cap of inline.allow) {
                    rules.push({ capability: cap, action: 'allow' });
                }
            }
            if (inline.deny) {
                for (const cap of inline.deny) {
                    rules.push({ capability: cap, action: 'deny' });
                }
            }
            this.cachedPolicy = {
                version: '1',
                defaultAction: inline.default ?? 'deny',
                rules,
            };
        }
        else {
            this.cachedPolicy = policy.loadPolicy(this.dataDir);
        }
        return this.cachedPolicy;
    }
    /** Save a capability policy to YAML file */
    savePolicy(p) {
        policy.savePolicy(this.dataDir, p);
        this.cachedPolicy = p;
    }
    /** Log an audit event to the local JSON-lines file and route to reporter */
    logEvent(event) {
        // Accept 'outcome' as alias for 'result'
        if (!event.result && event.outcome) {
            event.result = event.outcome;
        }
        // Default plugin to 'unknown' if omitted
        if (!event.plugin) {
            event.plugin = 'unknown';
        }
        const logged = audit.logEvent(this.dataDir, event);
        // Route to aggregator → reporter pipeline if enabled
        if (this.aggregator) {
            this.aggregator.add(event);
        }
        else if (this.reporter) {
            this.reporter.enqueue(logged);
        }
        return logged;
    }
    /** Read audit events from local log */
    readAuditLog(options) {
        return audit.readAuditLog(this.dataDir, options);
    }
    /** Calculate the agent's trust score based on current state */
    calculateTrust() {
        const hasId = identity.loadIdentity(this.dataDir) !== null;
        return trust.calculateTrust(this.dataDir, hasId, this.trustHints);
    }
    /** Provide hints from plugins to improve trust score accuracy */
    setTrustHints(hints) {
        this.trustHints = { ...this.trustHints, ...hints };
    }
    /** Sign data with the agent's Ed25519 private key */
    sign(data) {
        const secretKey = identity.getSecretKey(this.dataDir);
        if (!secretKey) {
            throw new Error('No identity found. Call getIdentity() first to generate a keypair.');
        }
        return crypto.sign(data, secretKey);
    }
    /** Verify an Ed25519 signature against a public key (accepts base64 string or Uint8Array) */
    verify(data, signature, publicKey) {
        return crypto.verify(data, signature, publicKey);
    }
    /** Enable server reporting — batch POST audit events to AIM server */
    enableReporting(options) {
        if (!this.serverUrl) {
            throw new Error('Cannot enable reporting without serverUrl in AIMCoreOptions');
        }
        const id = this.getIdentity();
        this.reporter = new reporter_2.AIMServerReporter({
            serverUrl: this.serverUrl,
            agentId: id.agentId,
            dataDir: this.dataDir,
            apiToken: options?.apiToken,
            flushIntervalMs: options?.flushIntervalMs,
        });
        this.reporter.start();
    }
    /** Enable event aggregation — summarize repeated events before reporting */
    enableAggregation(windowMs) {
        this.aggregator = new aggregator_2.EventAggregator(windowMs);
        this.aggregator.setFlushHandler((events) => {
            for (const event of events) {
                this.reporter?.enqueue(event);
            }
        });
        this.aggregator.start();
    }
    /** Stop reporter and aggregator, flush remaining events */
    async shutdown() {
        if (this.aggregator) {
            this.aggregator.stop();
            this.aggregator = null;
        }
        if (this.reporter) {
            await this.reporter.stop();
            this.reporter = null;
        }
    }
    /** Get the data directory path */
    getDataDir() {
        return this.dataDir;
    }
    /**
     * Get a VaultStore instance for this agent's vault.
     * The vault directory is at ~/.aim/vault/ (separate from the data dir).
     */
    getVault() {
        const home = process.env.HOME ?? process.env.USERPROFILE ?? '/tmp';
        return new store_1.VaultStore(`${home}/.aim/vault`);
    }
    defaultDataDir() {
        const home = process.env.HOME ?? process.env.USERPROFILE ?? '/tmp';
        return `${home}/.lab/aim-core`;
    }
}
exports.AIMCore = AIMCore;
//# sourceMappingURL=index.js.map