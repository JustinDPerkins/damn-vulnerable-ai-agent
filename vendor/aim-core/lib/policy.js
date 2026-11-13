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
exports.loadPolicy = loadPolicy;
exports.savePolicy = savePolicy;
exports.checkCapability = checkCapability;
exports.hasPolicy = hasPolicy;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const yaml = __importStar(require("js-yaml"));
const POLICY_FILE = 'policy.yaml';
const DEFAULT_POLICY = {
    version: '1',
    defaultAction: 'deny',
    rules: [],
};
/** Load capability policy from YAML file, or return default */
function loadPolicy(dataDir) {
    const filePath = path.join(dataDir, POLICY_FILE);
    if (!fs.existsSync(filePath)) {
        return DEFAULT_POLICY;
    }
    let parsed;
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        parsed = yaml.load(raw, { schema: yaml.FAILSAFE_SCHEMA });
    }
    catch {
        return DEFAULT_POLICY;
    }
    if (!parsed || typeof parsed !== 'object') {
        return DEFAULT_POLICY;
    }
    // Reject prototype pollution attempts
    const keys = Object.keys(parsed);
    if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
        return DEFAULT_POLICY;
    }
    return {
        version: String(parsed.version ?? '1'),
        defaultAction: parsed.defaultAction === 'allow' ? 'allow' : 'deny',
        rules: Array.isArray(parsed.rules) ? parsed.rules.map(parseRule) : [],
    };
}
/** Save a capability policy to YAML file */
function savePolicy(dataDir, policy) {
    fs.mkdirSync(dataDir, { recursive: true });
    const filePath = path.join(dataDir, POLICY_FILE);
    const tmpPath = filePath + '.tmp.' + process.pid;
    fs.writeFileSync(tmpPath, yaml.dump(policy), 'utf-8');
    fs.renameSync(tmpPath, filePath);
}
/** Check if a capability is allowed by the policy */
function checkCapability(policy, capability, plugin) {
    for (const rule of policy.rules) {
        if (matchesCapability(rule.capability, capability)) {
            // If rule restricts to specific plugins, check plugin name
            if (rule.plugins && rule.plugins.length > 0) {
                if (!plugin || !rule.plugins.includes(plugin)) {
                    continue; // Rule doesn't apply to this plugin
                }
            }
            return rule.action === 'allow';
        }
    }
    // No rule matched — use default
    return policy.defaultAction === 'allow';
}
/** Check if a policy file exists */
function hasPolicy(dataDir) {
    return fs.existsSync(path.join(dataDir, POLICY_FILE));
}
// --- Internal helpers ---
function parseRule(raw) {
    const obj = raw;
    return {
        capability: String(obj.capability ?? '*'),
        action: (obj.action ?? obj.effect) === 'allow' ? 'allow' : 'deny',
        plugins: Array.isArray(obj.plugins) ? obj.plugins.map(String) : undefined,
    };
}
/**
 * Match a capability against a pattern.
 * Supports:
 *   "*"           → matches everything
 *   "db:*"        → matches "db:read", "db:write", etc.
 *   "fs:write:*"  → matches "fs:write:/tmp/foo", "fs:write:/var/log"
 *   "db:read"     → exact match
 */
function matchesCapability(pattern, capability) {
    if (pattern === '*')
        return true;
    if (pattern === capability)
        return true;
    if (pattern.endsWith(':*')) {
        const prefix = pattern.slice(0, -1); // "db:" from "db:*"
        return capability.startsWith(prefix) && capability.length > prefix.length;
    }
    return false;
}
//# sourceMappingURL=policy.js.map