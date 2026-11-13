import type { CapabilityPolicy } from './types';
/** Load capability policy from YAML file, or return default */
export declare function loadPolicy(dataDir: string): CapabilityPolicy;
/** Save a capability policy to YAML file */
export declare function savePolicy(dataDir: string, policy: CapabilityPolicy): void;
/** Check if a capability is allowed by the policy */
export declare function checkCapability(policy: CapabilityPolicy, capability: string, plugin?: string): boolean;
/** Check if a policy file exists */
export declare function hasPolicy(dataDir: string): boolean;
//# sourceMappingURL=policy.d.ts.map