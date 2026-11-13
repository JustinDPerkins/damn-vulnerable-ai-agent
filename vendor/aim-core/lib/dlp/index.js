"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_PATTERNS = exports.defaultDLPPolicy = exports.getDLPAction = exports.maskAll = exports.mask = exports.SECRET_PATTERNS = exports.PII_PATTERNS = void 0;
exports.scanText = scanText;
exports.maskMetadata = maskMetadata;
const pii_detector_1 = require("./pii-detector");
const secret_detector_1 = require("./secret-detector");
const masking_1 = require("./masking");
const policy_1 = require("./policy");
var pii_detector_2 = require("./pii-detector");
Object.defineProperty(exports, "PII_PATTERNS", { enumerable: true, get: function () { return pii_detector_2.PII_PATTERNS; } });
var secret_detector_2 = require("./secret-detector");
Object.defineProperty(exports, "SECRET_PATTERNS", { enumerable: true, get: function () { return secret_detector_2.SECRET_PATTERNS; } });
var masking_2 = require("./masking");
Object.defineProperty(exports, "mask", { enumerable: true, get: function () { return masking_2.mask; } });
Object.defineProperty(exports, "maskAll", { enumerable: true, get: function () { return masking_2.maskAll; } });
var policy_2 = require("./policy");
Object.defineProperty(exports, "getDLPAction", { enumerable: true, get: function () { return policy_2.getDLPAction; } });
Object.defineProperty(exports, "defaultDLPPolicy", { enumerable: true, get: function () { return policy_2.defaultDLPPolicy; } });
/** All built-in DLP patterns */
exports.ALL_PATTERNS = [...pii_detector_1.PII_PATTERNS, ...secret_detector_1.SECRET_PATTERNS];
/**
 * Scan text for DLP violations — PII, credentials, and sensitive data.
 * Returns detection results with masked text.
 */
function scanText(text, options) {
    const patterns = options?.patterns ?? exports.ALL_PATTERNS;
    const policy = options?.policy;
    const matches = [];
    let hasBlocked = false;
    let hasMasked = false;
    // Run detection
    for (const pattern of patterns) {
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
        let regexMatch;
        while ((regexMatch = regex.exec(text)) !== null) {
            const action = (0, policy_1.getDLPAction)(pattern, policy);
            if (action === 'allow')
                continue;
            const masked = (0, masking_1.mask)(regexMatch[0], pattern);
            matches.push({
                patternId: pattern.id,
                patternName: pattern.name,
                severity: pattern.severity,
                category: pattern.category,
                offset: regexMatch.index,
                length: regexMatch[0].length,
                original: regexMatch[0],
                masked,
            });
            if (action === 'block')
                hasBlocked = true;
            if (action === 'mask')
                hasMasked = true;
        }
    }
    // Sort by offset
    matches.sort((a, b) => a.offset - b.offset);
    // Determine overall action
    let action;
    if (hasBlocked) {
        action = 'blocked';
    }
    else if (hasMasked || matches.length > 0) {
        action = 'masked';
    }
    else {
        action = 'allowed';
    }
    // Build masked text (apply all mask/block replacements)
    const patternsToMask = patterns.filter((p) => {
        const a = (0, policy_1.getDLPAction)(p, policy);
        return a === 'mask' || a === 'block';
    });
    const { maskedText } = (0, masking_1.maskAll)(text, patternsToMask);
    return {
        detected: matches.length > 0,
        matches,
        maskedText,
        action,
    };
}
/**
 * Mask metadata before writing to audit log.
 * Scans string values in metadata for sensitive data and masks them.
 */
function maskMetadata(metadata, policy) {
    const result = {};
    for (const [key, value] of Object.entries(metadata)) {
        if (typeof value === 'string') {
            const scan = scanText(value, { policy });
            result[key] = scan.detected ? scan.maskedText : value;
        }
        else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            result[key] = maskMetadata(value, policy);
        }
        else {
            result[key] = value;
        }
    }
    return result;
}
//# sourceMappingURL=index.js.map