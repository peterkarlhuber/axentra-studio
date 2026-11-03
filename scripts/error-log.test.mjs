import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Ops audit OPS2-03: with the API unreachable, nginx's error log quotes the whole request line of
 * a proxied `/v1` request, including the query string (`/v1/auth/oidc/callback?code=...&state=...`).
 * The `/v1/` location therefore logs only critical errors; the access log (path only, see
 * access-log.test.mjs) still records the failed request with its status.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const LEVELS = ['debug', 'info', 'notice', 'warn', 'error', 'crit', 'alert', 'emerg'];

/** The body of `location <prefix> { ... }` (no nested blocks in these templates). */
function locationBody(source, prefix) {
  const match = new RegExp(`location\\s+${prefix.replace(/[/.]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(
    source,
  );
  return match ? match[1] : null;
}

describe('nginx error log', () => {
  const proxy = read('docker/api-proxy.conf.template');

  it('logs only critical errors for the proxied /v1 requests', () => {
    const body = locationBody(proxy, '/v1/');
    expect(body).not.toBeNull();
    const directive = /^\s*error_log\s+(\S+)\s+(\w+)\s*;/m.exec(body);
    expect(directive, 'error_log inside location /v1/').not.toBeNull();
    expect(LEVELS.indexOf(directive[2])).toBeGreaterThanOrEqual(LEVELS.indexOf('crit'));
  });

  it('sets no error_log below crit anywhere that /v1 requests could reach', () => {
    for (const file of ['docker/nginx.conf', 'docker/api-proxy.conf.template']) {
      for (const [, level] of read(file).matchAll(/error_log\s+\S+\s+(\w+)\s*;/g)) {
        expect(LEVELS.indexOf(level), `${file}: error_log ${level}`).toBeGreaterThanOrEqual(
          LEVELS.indexOf('crit'),
        );
      }
    }
  });
});
