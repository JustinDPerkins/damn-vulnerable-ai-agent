/**
 * Vault namespace management.
 *
 * Namespaces group credentials by service/purpose and define access policies
 * (allowed operations, URL patterns). Metadata is stored in a separate JSON
 * file — no credential material here.
 */
import type { VaultNamespace, VaultOperation } from './types';
export interface CreateNamespaceOptions {
    id: string;
    description: string;
    agentId: string;
    operations: VaultOperation[];
    urlPatterns: string[];
}
/**
 * Create a new namespace in the vault.
 *
 * @throws if namespace ID already exists
 */
export declare function createNamespace(vaultDir: string, options: CreateNamespaceOptions): VaultNamespace;
/** List all namespaces (including revoked) */
export declare function listNamespaces(vaultDir: string): VaultNamespace[];
/**
 * Get a single namespace by ID.
 *
 * @returns The namespace, or null if not found
 */
export declare function getNamespace(vaultDir: string, id: string): VaultNamespace | null;
export interface UpdateNamespaceOptions {
    description?: string;
    operations?: VaultOperation[];
    urlPatterns?: string[];
}
/**
 * Update an existing namespace's metadata.
 *
 * @throws if namespace not found or is revoked
 */
export declare function updateNamespace(vaultDir: string, id: string, updates: UpdateNamespaceOptions): VaultNamespace;
/**
 * Revoke a namespace — marks it as revoked. Credentials for this namespace
 * will no longer be resolvable.
 *
 * @param deleteCredentials - If true, also deletes the credential from the VaultStore.
 *                            Caller is responsible for calling store.deleteCredential().
 * @throws if namespace not found
 * @returns true if newly revoked, false if already revoked
 */
export declare function revokeNamespace(vaultDir: string, id: string): boolean;
//# sourceMappingURL=namespaces.d.ts.map