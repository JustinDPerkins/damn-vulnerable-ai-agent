/**
 * Minimal CLI helpers previously pulled from an upstream UI package.
 */

export function versionLine({ tool, version, telemetry } = {}) {
  const tele = telemetry?.enabled ? 'telemetry on' : 'telemetry off';
  return `${tool || 'dvaa'} ${version || ''} (${tele})`.trim();
}

export function runTelemetryCommand(action, { tool = 'dvaa', getStatus, setOptOut } = {}) {
  const a = action === undefined || action === 'status' ? 'status' : action;
  if (a === 'on') {
    setOptOut?.(false);
    return `${tool}: telemetry enabled (local shim; nothing is sent).`;
  }
  if (a === 'off') {
    setOptOut?.(true);
    return `${tool}: telemetry disabled.`;
  }
  if (a === '--help' || a === '-h') {
    return 'Usage: dvaa telemetry [on|off|status]';
  }
  const s = getStatus?.() || { enabled: false };
  return `${tool}: telemetry ${s.enabled ? 'on' : 'off'} (local shim).`;
}
