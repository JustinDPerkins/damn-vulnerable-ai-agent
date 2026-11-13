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
exports.createIdentity = createIdentity;
exports.loadIdentity = loadIdentity;
exports.getOrCreateIdentity = getOrCreateIdentity;
exports.getSecretKey = getSecretKey;
exports.getPublicKey = getPublicKey;
const nacl = __importStar(require("tweetnacl"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const IDENTITY_FILE = 'identity.json';
/** Derive a short agent ID from an Ed25519 public key */
function deriveAgentId(publicKey) {
    // Use first 12 bytes of public key, base64url-encoded, prefixed with "aim_"
    const idBytes = publicKey.slice(0, 12);
    const b64 = Buffer.from(idBytes)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    return `aim_${b64}`;
}
/** Generate a new Ed25519 keypair and store it */
function createIdentity(dataDir, agentName) {
    const keypair = nacl.sign.keyPair();
    const identity = {
        agentId: deriveAgentId(keypair.publicKey),
        publicKey: Buffer.from(keypair.publicKey).toString('base64'),
        secretKey: Buffer.from(keypair.secretKey).toString('base64'),
        agentName,
        createdAt: new Date().toISOString(),
    };
    fs.mkdirSync(dataDir, { recursive: true });
    const identityPath = path.join(dataDir, IDENTITY_FILE);
    const tmpPath = identityPath + '.tmp.' + process.pid;
    fs.writeFileSync(tmpPath, JSON.stringify(identity, null, 2), 'utf-8');
    try {
        fs.chmodSync(tmpPath, 0o600);
    }
    catch { /* Windows */ }
    fs.renameSync(tmpPath, identityPath);
    return identity;
}
/** Load an existing identity from disk */
function loadIdentity(dataDir) {
    const filePath = path.join(dataDir, IDENTITY_FILE);
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
/** Get or create the agent's identity. Returns the public-facing identity (no secret key). */
function getOrCreateIdentity(dataDir, agentName) {
    let stored = loadIdentity(dataDir);
    if (!stored) {
        stored = createIdentity(dataDir, agentName);
    }
    // Return public identity only (strip secret key)
    return {
        agentId: stored.agentId,
        publicKey: stored.publicKey,
        agentName: stored.agentName,
        createdAt: stored.createdAt,
    };
}
/** Get the Ed25519 secret key as Uint8Array (for signing operations) */
function getSecretKey(dataDir) {
    const stored = loadIdentity(dataDir);
    if (!stored)
        return null;
    return Buffer.from(stored.secretKey, 'base64');
}
/** Get the Ed25519 public key as Uint8Array (for verification) */
function getPublicKey(dataDir) {
    const stored = loadIdentity(dataDir);
    if (!stored)
        return null;
    return Buffer.from(stored.publicKey, 'base64');
}
//# sourceMappingURL=identity.js.map