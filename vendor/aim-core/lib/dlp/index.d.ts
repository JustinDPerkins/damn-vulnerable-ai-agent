import type { DLPPattern, DLPScanResult, DLPPolicy } from './types';
export type { DLPPattern, DLPMatch, DLPScanResult, DLPPolicy } from './types';
export { PII_PATTERNS } from './pii-detector';
export { SECRET_PATTERNS } from './secret-detector';
export { mask, maskAll } from './masking';
export { getDLPAction, defaultDLPPolicy } from './policy';
/** All built-in DLP patterns */
export declare const ALL_PATTERNS: DLPPattern[];
/**
 * Scan text for DLP violations — PII, credentials, and sensitive data.
 * Returns detection results with masked text.
 */
export declare function scanText(text: string, options?: {
    patterns?: DLPPattern[];
    policy?: DLPPolicy;
}): DLPScanResult;
/**
 * Mask metadata before writing to audit log.
 * Scans string values in metadata for sensitive data and masks them.
 */
export declare function maskMetadata(metadata: Record<string, unknown>, policy?: DLPPolicy): Record<string, unknown>;
//# sourceMappingURL=index.d.ts.map