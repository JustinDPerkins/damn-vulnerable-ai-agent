"use strict";
// Vault module — identity-native encrypted credential storage
//
// CR-001: credential never in agent context
// CR-005: zero plaintext on disk
// CR-006: fail closed
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveWithPolicy = exports.createResolutionRequest = exports.readVaultAudit = exports.logVaultEvent = exports.revokeNamespace = exports.updateNamespace = exports.getNamespace = exports.listNamespaces = exports.createNamespace = exports.VaultStore = exports.zeroize = exports.decrypt = exports.encrypt = exports.generateEphemeralKeypair = exports.deriveVaultKey = exports.ed25519SecretKeyToX25519 = exports.ed25519PublicKeyToX25519 = void 0;
// Crypto
var crypto_1 = require("./crypto");
Object.defineProperty(exports, "ed25519PublicKeyToX25519", { enumerable: true, get: function () { return crypto_1.ed25519PublicKeyToX25519; } });
Object.defineProperty(exports, "ed25519SecretKeyToX25519", { enumerable: true, get: function () { return crypto_1.ed25519SecretKeyToX25519; } });
Object.defineProperty(exports, "deriveVaultKey", { enumerable: true, get: function () { return crypto_1.deriveVaultKey; } });
Object.defineProperty(exports, "generateEphemeralKeypair", { enumerable: true, get: function () { return crypto_1.generateEphemeralKeypair; } });
Object.defineProperty(exports, "encrypt", { enumerable: true, get: function () { return crypto_1.encrypt; } });
Object.defineProperty(exports, "decrypt", { enumerable: true, get: function () { return crypto_1.decrypt; } });
Object.defineProperty(exports, "zeroize", { enumerable: true, get: function () { return crypto_1.zeroize; } });
// Store
var store_1 = require("./store");
Object.defineProperty(exports, "VaultStore", { enumerable: true, get: function () { return store_1.VaultStore; } });
// Namespaces
var namespaces_1 = require("./namespaces");
Object.defineProperty(exports, "createNamespace", { enumerable: true, get: function () { return namespaces_1.createNamespace; } });
Object.defineProperty(exports, "listNamespaces", { enumerable: true, get: function () { return namespaces_1.listNamespaces; } });
Object.defineProperty(exports, "getNamespace", { enumerable: true, get: function () { return namespaces_1.getNamespace; } });
Object.defineProperty(exports, "updateNamespace", { enumerable: true, get: function () { return namespaces_1.updateNamespace; } });
Object.defineProperty(exports, "revokeNamespace", { enumerable: true, get: function () { return namespaces_1.revokeNamespace; } });
// Audit
var audit_1 = require("./audit");
Object.defineProperty(exports, "logVaultEvent", { enumerable: true, get: function () { return audit_1.logVaultEvent; } });
Object.defineProperty(exports, "readVaultAudit", { enumerable: true, get: function () { return audit_1.readVaultAudit; } });
// Resolution
var resolution_1 = require("./resolution");
Object.defineProperty(exports, "createResolutionRequest", { enumerable: true, get: function () { return resolution_1.createResolutionRequest; } });
Object.defineProperty(exports, "resolveWithPolicy", { enumerable: true, get: function () { return resolution_1.resolveWithPolicy; } });
//# sourceMappingURL=index.js.map