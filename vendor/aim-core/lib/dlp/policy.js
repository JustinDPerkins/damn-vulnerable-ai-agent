"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDLPAction = getDLPAction;
exports.defaultDLPPolicy = defaultDLPPolicy;
/** Default DLP policy: mask credentials and PII, allow infrastructure */
const DEFAULT_DLP_POLICY = {
    enabled: true,
    defaultAction: 'mask',
    categories: {
        credential: 'block',
        pii: 'mask',
        financial: 'mask',
        infrastructure: 'allow',
    },
};
/**
 * Determine the DLP action for a matched pattern.
 * Priority: per-pattern override > per-category override > default action.
 */
function getDLPAction(pattern, dlpPolicy) {
    const policy = dlpPolicy ?? DEFAULT_DLP_POLICY;
    if (!policy.enabled)
        return 'allow';
    // Per-pattern override
    if (policy.patterns?.[pattern.id]) {
        return policy.patterns[pattern.id];
    }
    // Per-category override
    const categoryAction = policy.categories?.[pattern.category];
    if (categoryAction) {
        return categoryAction;
    }
    return policy.defaultAction;
}
/** Create a default DLP policy */
function defaultDLPPolicy() {
    return { ...DEFAULT_DLP_POLICY };
}
//# sourceMappingURL=policy.js.map