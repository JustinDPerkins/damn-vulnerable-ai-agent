/**
 * Local no-op telemetry shim (replaces the former upstream SDK).
 * Keeps CLI/dashboard call sites working without any external registry.
 */

let session = {
  enabled: false,
  installId: 'local',
};

function envDisabled() {
  const v = String(process.env.DVAA_TELEMETRY || '').toLowerCase();
  return v === '' || v === 'off' || v === '0' || v === 'false' || v === 'no';
}

export async function init(opts = {}) {
  session = {
    tool: opts.tool || 'dvaa',
    version: opts.version || '0.0.0',
    installId: 'local',
    enabled: !envDisabled(),
  };
}

export function start() {}
export async function track() {}
export function error() {}
export async function flush() {}

export function status() {
  return {
    enabled: session.enabled,
    configPath: '(none)',
    policyURL: '',
    installId: session.installId,
  };
}

export function setOptOut(off) {
  session.enabled = !off;
  return status();
}
