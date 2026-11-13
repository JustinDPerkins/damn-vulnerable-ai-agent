/**
 * Lab fork gate: no opena2a / OpenA2A / OPENA2A strings in tracked sources.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'coverage', '.dvaa', '.dvaa-aim',
  '.hackmyagent-cache', '.hackmyagent-backup', '.playwright-mcp',
]);
const SELF = path.relative(ROOT, fileURLToPath(import.meta.url));
const BANNED = /opena2a/i;

function walk(dir, hits) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.isDirectory()) {
      if (!SKIP_DIRS.has(ent.name)) walk(path.join(dir, ent.name), hits);
      continue;
    }
    const abs = path.join(dir, ent.name);
    const rel = path.relative(ROOT, abs);
    if (rel === SELF) continue;
    const buf = fs.readFileSync(abs);
    if (buf.subarray(0, 8000).includes(0)) continue;
    const text = buf.toString('utf8');
    text.split('\n').forEach((line, i) => {
      if (BANNED.test(line)) hits.push(`${rel}:${i + 1}:${line.trim().slice(0, 120)}`);
    });
  }
}

test('repository sources contain no opena2a strings', () => {
  const hits = [];
  walk(ROOT, hits);
  assert.deepEqual(hits, [], hits.join('\n'));
});
