import type { DLPPolicy, DLPPattern } from './types';
/**
 * Determine the DLP action for a matched pattern.
 * Priority: per-pattern override > per-category override > default action.
 */
export declare function getDLPAction(pattern: DLPPattern, dlpPolicy?: DLPPolicy): 'allow' | 'mask' | 'block';
/** Create a default DLP policy */
export declare function defaultDLPPolicy(): DLPPolicy;
//# sourceMappingURL=policy.d.ts.map