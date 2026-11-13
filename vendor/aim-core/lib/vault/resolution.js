"use strict";
/**
 * Vault credential resolution with policy enforcement.
 *
 * Implements the local vault resolution flow (simplified 8-step from the spec):
 * 1. Verify Ed25519 signature
 * 2. (ATC check — skipped in local-only mode)
 * 3. Load namespace, verify status + operation
 * 4. Check capability (vault:resolve:<namespace>)
 * 5. Retrieve encrypted blob from VaultStore
 * 6. Decrypt with vault key
 * 7. (Zeroize — caller responsibility)
 * 8. Write audit entry
 *
 * CR-001: credential never in agent context
 * CR-002: Ed25519 signature required
 * CR-003: capability check before release
 * CR-006: fail closed
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
exports.createResolutionRequest = createResolutionRequest;
exports.resolveWithPolicy = resolveWithPolicy;
const nacl = __importStar(require("tweetnacl"));
const crypto = __importStar(require("crypto"));
const namespaces_1 = require("./namespaces");
const audit_1 = require("./audit");
/** Maximum age of a nonce before it's considered stale (30 seconds) */
const NONCE_MAX_AGE_MS = 30000;
/**
 * Create a signed resolution request.
 *
 * The agent signs `namespace|operation|nonce` with its Ed25519 secret key.
 * This proves the resolution request came from the agent that owns the vault.
 */
function createResolutionRequest(namespace, operation, agentId, edSecretKey) {
    const nonce = new Date().toISOString() + '.' + crypto.randomBytes(8).toString('hex');
    const message = `${namespace}|${operation}|${nonce}`;
    const messageBytes = new TextEncoder().encode(message);
    const signature = nacl.sign.detached(messageBytes, edSecretKey);
    return {
        namespace,
        operation,
        signature: Buffer.from(signature).toString('base64'),
        nonce,
        agentId,
    };
}
/**
 * Resolve a credential with full policy enforcement.
 *
 * Performs the local vault resolution flow:
 * 1. Verify Ed25519 signature over request payload
 * 2. Check nonce freshness (replay protection)
 * 3. Load namespace, verify active + operation allowed
 * 4. Check capability if checker provided
 * 5. Decrypt credential from vault
 * 6. Log audit event (always — success or failure)
 *
 * @returns VaultResolutionResult with decrypted credential on success.
 *          Caller MUST zeroize the credential after use.
 */
function resolveWithPolicy(request, context) {
    const { vaultDir, store, edPublicKey, checkCapability } = context;
    // Step 1: Verify Ed25519 signature (CR-002)
    const message = `${request.namespace}|${request.operation}|${request.nonce}`;
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = new Uint8Array(Buffer.from(request.signature, 'base64'));
    const signatureValid = nacl.sign.detached.verify(messageBytes, signatureBytes, edPublicKey);
    if (!signatureValid) {
        (0, audit_1.logVaultEvent)(vaultDir, {
            agentId: request.agentId,
            namespace: request.namespace,
            operation: 'resolve',
            result: 'denied',
            denyReason: 'invalid Ed25519 signature',
        });
        return {
            success: false,
            error: 'Invalid signature',
            namespace: request.namespace,
        };
    }
    // Step 2: Nonce freshness check (replay protection)
    const nonceParts = request.nonce.split('.');
    const nonceTimestamp = nonceParts.slice(0, -1).join('.');
    const nonceAge = Date.now() - new Date(nonceTimestamp).getTime();
    if (nonceAge > NONCE_MAX_AGE_MS || nonceAge < -NONCE_MAX_AGE_MS) {
        (0, audit_1.logVaultEvent)(vaultDir, {
            agentId: request.agentId,
            namespace: request.namespace,
            operation: 'resolve',
            result: 'denied',
            denyReason: 'stale nonce (replay protection)',
        });
        return {
            success: false,
            error: 'Stale nonce — request expired or replayed',
            namespace: request.namespace,
        };
    }
    // Step 3: Load namespace, verify status + operation
    const ns = (0, namespaces_1.getNamespace)(vaultDir, request.namespace);
    if (!ns) {
        (0, audit_1.logVaultEvent)(vaultDir, {
            agentId: request.agentId,
            namespace: request.namespace,
            operation: 'resolve',
            result: 'denied',
            denyReason: 'namespace not found',
        });
        return {
            success: false,
            error: `Namespace "${request.namespace}" not found`,
            namespace: request.namespace,
        };
    }
    if (ns.status === 'revoked') {
        (0, audit_1.logVaultEvent)(vaultDir, {
            agentId: request.agentId,
            namespace: request.namespace,
            operation: 'resolve',
            result: 'denied',
            denyReason: 'namespace revoked',
        });
        return {
            success: false,
            error: `Namespace "${request.namespace}" is revoked`,
            namespace: request.namespace,
        };
    }
    if (!ns.operations.includes(request.operation)) {
        (0, audit_1.logVaultEvent)(vaultDir, {
            agentId: request.agentId,
            namespace: request.namespace,
            operation: 'resolve',
            result: 'denied',
            denyReason: `operation "${request.operation}" not allowed`,
        });
        return {
            success: false,
            error: `Operation "${request.operation}" not allowed for namespace "${request.namespace}"`,
            namespace: request.namespace,
        };
    }
    // Step 4: Capability check (CR-003)
    if (checkCapability) {
        const requiredCapability = `vault:resolve:${request.namespace}`;
        if (!checkCapability(requiredCapability)) {
            (0, audit_1.logVaultEvent)(vaultDir, {
                agentId: request.agentId,
                namespace: request.namespace,
                operation: 'resolve',
                result: 'denied',
                denyReason: `missing capability "${requiredCapability}"`,
            });
            return {
                success: false,
                error: `Missing capability: ${requiredCapability}`,
                namespace: request.namespace,
            };
        }
    }
    // Step 5 + 6: Decrypt credential (CR-006: fail closed)
    let credential;
    try {
        credential = store.resolveCredential(request.namespace);
    }
    catch (err) {
        (0, audit_1.logVaultEvent)(vaultDir, {
            agentId: request.agentId,
            namespace: request.namespace,
            operation: 'resolve',
            result: 'error',
            denyReason: err instanceof Error ? err.message : 'unknown decryption error',
        });
        return {
            success: false,
            error: 'Failed to decrypt credential',
            namespace: request.namespace,
        };
    }
    // Step 8: Audit (success)
    const list = store.listCredentials();
    const credMeta = list.find((c) => c.namespace === request.namespace);
    (0, audit_1.logVaultEvent)(vaultDir, {
        agentId: request.agentId,
        namespace: request.namespace,
        operation: 'resolve',
        result: 'granted',
        metadata: { version: credMeta?.version },
    });
    return {
        success: true,
        credential,
        namespace: request.namespace,
        version: credMeta?.version,
    };
}
//# sourceMappingURL=resolution.js.map