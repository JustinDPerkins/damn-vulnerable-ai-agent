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
exports.mask = mask;
exports.maskAll = maskAll;
const crypto = __importStar(require("crypto"));
/**
 * Mask a value based on the specified strategy.
 *
 * Strategies:
 *   full:    Replace entirely with [REDACTED:<id>]
 *   partial: Show first 4 and last 4 chars, mask middle with ***
 *   hash:    Replace with SHA-256 hash prefix
 */
function mask(value, pattern) {
    if (!pattern) {
        return '[REDACTED]';
    }
    switch (pattern.maskStrategy) {
        case 'full':
            return `[REDACTED:${pattern.id}]`;
        case 'partial':
            return maskPartial(value, pattern.id);
        case 'hash':
            return maskHash(value, pattern.id);
        default:
            return `[REDACTED:${pattern.id}]`;
    }
}
function maskPartial(value, id) {
    if (value.length <= 8) {
        return `[REDACTED:${id}]`;
    }
    const prefix = value.slice(0, 4);
    const suffix = value.slice(-4);
    return `${prefix}***${suffix}`;
}
function maskHash(value, id) {
    const hash = crypto.createHash('sha256').update(value).digest('hex').slice(0, 8);
    return `[HASH:${id}:${hash}]`;
}
/**
 * Mask all occurrences of a pattern in text.
 * Returns the masked text and info about each replacement.
 */
function maskAll(text, patterns) {
    const replacements = [];
    // Collect all matches first (to handle overlapping patterns)
    const allMatches = [];
    for (const pattern of patterns) {
        // Reset regex state
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
        let match;
        while ((match = regex.exec(text)) !== null) {
            allMatches.push({
                start: match.index,
                end: match.index + match[0].length,
                pattern,
                original: match[0],
            });
        }
    }
    // Sort by position (earliest first), then longest match first for overlaps
    allMatches.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    // Apply replacements from end to start to preserve offsets
    let maskedText = text;
    let lastEnd = -1;
    const deduped = [];
    for (const m of allMatches) {
        if (m.start >= lastEnd) {
            deduped.push(m);
            lastEnd = m.end;
        }
    }
    // Apply from end to preserve earlier offsets
    for (let i = deduped.length - 1; i >= 0; i--) {
        const m = deduped[i];
        const masked = mask(m.original, m.pattern);
        maskedText = maskedText.slice(0, m.start) + masked + maskedText.slice(m.end);
        replacements.unshift({
            patternId: m.pattern.id,
            original: m.original,
            masked,
            offset: m.start,
        });
    }
    return { maskedText, replacements };
}
//# sourceMappingURL=masking.js.map