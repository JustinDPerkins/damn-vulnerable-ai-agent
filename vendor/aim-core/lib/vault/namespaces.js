"use strict";
/**
 * Vault namespace management.
 *
 * Namespaces group credentials by service/purpose and define access policies
 * (allowed operations, URL patterns). Metadata is stored in a separate JSON
 * file — no credential material here.
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
exports.createNamespace = createNamespace;
exports.listNamespaces = listNamespaces;
exports.getNamespace = getNamespace;
exports.updateNamespace = updateNamespace;
exports.revokeNamespace = revokeNamespace;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const NAMESPACES_FILE = 'namespaces.json';
/** Load the namespaces file from the vault directory */
function loadNamespaces(vaultDir) {
    const filePath = path.join(vaultDir, NAMESPACES_FILE);
    if (!fs.existsSync(filePath)) {
        return { namespaces: {} };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
}
/** Atomically write the namespaces file */
function saveNamespaces(vaultDir, data) {
    const filePath = path.join(vaultDir, NAMESPACES_FILE);
    const tmpPath = filePath + '.tmp.' + process.pid;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    try {
        fs.chmodSync(tmpPath, 0o600);
    }
    catch { /* Windows */ }
    fs.renameSync(tmpPath, filePath);
}
/**
 * Create a new namespace in the vault.
 *
 * @throws if namespace ID already exists
 */
function createNamespace(vaultDir, options) {
    const data = loadNamespaces(vaultDir);
    if (data.namespaces[options.id]) {
        throw new Error(`Namespace "${options.id}" already exists`);
    }
    const now = new Date().toISOString();
    const ns = {
        id: options.id,
        description: options.description,
        agentId: options.agentId,
        operations: options.operations,
        urlPatterns: options.urlPatterns,
        status: 'active',
        createdAt: now,
        updatedAt: now,
    };
    data.namespaces[options.id] = ns;
    saveNamespaces(vaultDir, data);
    return ns;
}
/** List all namespaces (including revoked) */
function listNamespaces(vaultDir) {
    const data = loadNamespaces(vaultDir);
    return Object.values(data.namespaces);
}
/**
 * Get a single namespace by ID.
 *
 * @returns The namespace, or null if not found
 */
function getNamespace(vaultDir, id) {
    const data = loadNamespaces(vaultDir);
    return data.namespaces[id] ?? null;
}
/**
 * Update an existing namespace's metadata.
 *
 * @throws if namespace not found or is revoked
 */
function updateNamespace(vaultDir, id, updates) {
    const data = loadNamespaces(vaultDir);
    const ns = data.namespaces[id];
    if (!ns) {
        throw new Error(`Namespace "${id}" not found`);
    }
    if (ns.status === 'revoked') {
        throw new Error(`Namespace "${id}" is revoked and cannot be updated`);
    }
    if (updates.description !== undefined)
        ns.description = updates.description;
    if (updates.operations !== undefined)
        ns.operations = updates.operations;
    if (updates.urlPatterns !== undefined)
        ns.urlPatterns = updates.urlPatterns;
    ns.updatedAt = new Date().toISOString();
    data.namespaces[id] = ns;
    saveNamespaces(vaultDir, data);
    return ns;
}
/**
 * Revoke a namespace — marks it as revoked. Credentials for this namespace
 * will no longer be resolvable.
 *
 * @param deleteCredentials - If true, also deletes the credential from the VaultStore.
 *                            Caller is responsible for calling store.deleteCredential().
 * @throws if namespace not found
 * @returns true if newly revoked, false if already revoked
 */
function revokeNamespace(vaultDir, id) {
    const data = loadNamespaces(vaultDir);
    const ns = data.namespaces[id];
    if (!ns) {
        throw new Error(`Namespace "${id}" not found`);
    }
    if (ns.status === 'revoked') {
        return false; // Already revoked
    }
    ns.status = 'revoked';
    ns.updatedAt = new Date().toISOString();
    data.namespaces[id] = ns;
    saveNamespaces(vaultDir, data);
    return true;
}
//# sourceMappingURL=namespaces.js.map