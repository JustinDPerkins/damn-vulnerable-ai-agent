import type { DLPPattern } from './types';
/**
 * Mask a value based on the specified strategy.
 *
 * Strategies:
 *   full:    Replace entirely with [REDACTED:<id>]
 *   partial: Show first 4 and last 4 chars, mask middle with ***
 *   hash:    Replace with SHA-256 hash prefix
 */
export declare function mask(value: string, pattern?: DLPPattern): string;
/**
 * Mask all occurrences of a pattern in text.
 * Returns the masked text and info about each replacement.
 */
export declare function maskAll(text: string, patterns: DLPPattern[]): {
    maskedText: string;
    replacements: Array<{
        patternId: string;
        original: string;
        masked: string;
        offset: number;
    }>;
};
//# sourceMappingURL=masking.d.ts.map