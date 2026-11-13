"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateTrust = calculateTrust;
const audit_1 = require("./audit");
const policy_1 = require("./policy");
/** Weight for each trust factor (must sum to 1.0) */
const WEIGHTS = {
    identity: 0.20,
    capabilities: 0.15,
    auditLog: 0.10,
    secretsManaged: 0.15,
    configSigned: 0.10,
    skillsVerified: 0.10,
    networkControlled: 0.10,
    heartbeatMonitored: 0.10,
};
/**
 * Extended plugin signals that boost the overall score.
 * Each active signal provides a small bonus (up to 0.05 total).
 * This rewards comprehensive security posture without changing the base weights.
 */
const EXTENDED_SIGNALS = [
    'sessionsProtected',
    'promptsGuarded',
    'daemonHardened',
    'dlpEnabled',
    'runtimeProtected',
];
const MAX_EXTENDED_BONUS = 0.05;
/** Calculate trust score based on current state and plugin hints */
function calculateTrust(dataDir, hasIdentity, hints) {
    const factors = {
        identity: hasIdentity ? 1.0 : 0.0,
        capabilities: (0, policy_1.hasPolicy)(dataDir) ? 1.0 : 0.0,
        auditLog: (0, audit_1.hasAuditLog)(dataDir) ? 1.0 : 0.0,
        secretsManaged: hints?.secretsManaged ? 1.0 : 0.0,
        configSigned: hints?.configSigned ? 1.0 : 0.0,
        skillsVerified: hints?.skillsVerified ? 1.0 : 0.0,
        networkControlled: hints?.networkControlled ? 1.0 : 0.0,
        heartbeatMonitored: hints?.heartbeatMonitored ? 1.0 : 0.0,
    };
    let overall = 0;
    for (const [factor, weight] of Object.entries(WEIGHTS)) {
        overall += factors[factor] * weight;
    }
    // Extended plugin bonus: each active signal adds a proportional share of the max bonus
    if (hints) {
        const activeExtended = EXTENDED_SIGNALS.filter((s) => hints[s]).length;
        if (activeExtended > 0) {
            const bonus = (activeExtended / EXTENDED_SIGNALS.length) * MAX_EXTENDED_BONUS;
            overall += bonus;
        }
    }
    // Cap at 1.0 and round to 2 decimal places
    overall = Math.round(Math.min(overall, 1.0) * 100) / 100;
    const score = Math.round(overall * 100);
    const grade = score >= 80 ? 'strong' : score >= 60 ? 'good' : score >= 40 ? 'moderate' : score >= 20 ? 'improving' : 'needs-attention';
    return {
        overall,
        score,
        grade,
        factors,
        calculatedAt: new Date().toISOString(),
    };
}
//# sourceMappingURL=trust.js.map