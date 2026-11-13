import type { AIMIdentity, StoredIdentity } from './types';
/** Generate a new Ed25519 keypair and store it */
export declare function createIdentity(dataDir: string, agentName: string): StoredIdentity;
/** Load an existing identity from disk */
export declare function loadIdentity(dataDir: string): StoredIdentity | null;
/** Get or create the agent's identity. Returns the public-facing identity (no secret key). */
export declare function getOrCreateIdentity(dataDir: string, agentName: string): AIMIdentity;
/** Get the Ed25519 secret key as Uint8Array (for signing operations) */
export declare function getSecretKey(dataDir: string): Uint8Array | null;
/** Get the Ed25519 public key as Uint8Array (for verification) */
export declare function getPublicKey(dataDir: string): Uint8Array | null;
//# sourceMappingURL=identity.d.ts.map