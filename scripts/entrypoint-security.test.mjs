import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

/**
 * MUP-ONA VB-6: docker/40-axentra-studio.sh refuses an invalid AXENTRA_CSP_CONNECT_SRC (the
 * container start fails instead of writing the value into nginx's add_header line) and sends
 * Strict-Transport-Security only when AXENTRA_TLS_TERMINATED says TLS ends in front of the
 * container. The script runs as in the image (POSIX sh), with /etc/nginx/ moved to a temp dir.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const script = fs.readFileSync(path.join(root, 'docker/40-axentra-studio.sh'), 'utf8');
const dirs = [];

function run(env) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'axs-entrypoint-'));
  dirs.push(dir);
  fs.mkdirSync(path.join(dir, 'axentra-templates'));
  fs.copyFileSync(
    path.join(root, 'docker/api-proxy.conf.template'),
    path.join(dir, 'axentra-templates/api-proxy.conf.template'),
  );
  const copy = path.join(dir, 'entrypoint.sh');
  fs.writeFileSync(copy, script.replaceAll('/etc/nginx/', `${dir}/`));
  const result = spawnSync('sh', [copy], {
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8',
  });
  const headersFile = path.join(dir, 'axentra/security-headers.conf');
  const headers = fs.existsSync(headersFile) ? fs.readFileSync(headersFile, 'utf8') : null;
  return { status: result.status, stderr: result.stderr, headers };
}

const csp = (headers) => /Content-Security-Policy "([^"]*)"/.exec(headers)?.[1] ?? '';

afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

describe('docker/40-axentra-studio.sh', () => {
  // MUP-ONA T-A7-5
  it('starts with the default configuration: no extra sources, no HSTS', () => {
    const { status, headers } = run({});
    expect(status).toBe(0);
    expect(csp(headers)).toContain("connect-src 'self';");
    expect(headers).not.toContain('add_header Strict-Transport-Security');
  });

  // MUP-ONA T-A7-5
  it.each([
    'https://api.example.com',
    'https://api.example.com:8443',
    '  https://a.example.com\thttps://b.example.com:443  ',
  ])('accepts https origins: %j', (value) => {
    const { status, headers } = run({ AXENTRA_CSP_CONNECT_SRC: value });
    expect(status).toBe(0);
    expect(csp(headers)).toContain(`connect-src 'self' ${value.trim()};`);
  });

  // MUP-ONA T-A7-5
  it.each([
    'http://api.example.com',
    'wss://api.example.com',
    "'self'",
    "'unsafe-eval'",
    'https://*.example.com',
    'https://api.example.com/v1',
    'https://api.example.com; script-src *',
    'https://api.example.com" always; add_header X-Evil "1',
    'https://a.example.comhttps://b.example.com:1x',
    'https://api.example.com\nadd_header X-Evil 1;',
    'https://api.example.com\r',
    '*',
  ])('refuses %j and stops the start', (value) => {
    const { status, stderr } = run({ AXENTRA_CSP_CONNECT_SRC: value });
    expect(status).not.toBe(0);
    expect(stderr).toContain('AXENTRA_CSP_CONNECT_SRC');
  });

  // MUP-ONA T-A7-5
  it.each(['true', '1'])('sends HSTS when AXENTRA_TLS_TERMINATED=%s', (value) => {
    const { status, headers } = run({ AXENTRA_TLS_TERMINATED: value });
    expect(status).toBe(0);
    expect(headers).toContain(
      'add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;',
    );
  });

  // MUP-ONA T-A7-5
  it.each(['false', '0', ''])('sends no HSTS when AXENTRA_TLS_TERMINATED=%j', (value) => {
    const { status, headers } = run({ AXENTRA_TLS_TERMINATED: value });
    expect(status).toBe(0);
    expect(headers).not.toContain('add_header Strict-Transport-Security');
  });

  // MUP-ONA T-A7-5
  it('refuses an unknown AXENTRA_TLS_TERMINATED value', () => {
    const { status, stderr } = run({ AXENTRA_TLS_TERMINATED: 'yes' });
    expect(status).not.toBe(0);
    expect(stderr).toContain('AXENTRA_TLS_TERMINATED');
  });

  // MUP-ONA T-A7-5
  it('every location that serves Studio files includes the generated headers (HSTS included)', () => {
    const nginx = fs.readFileSync(path.join(root, 'docker/nginx.conf'), 'utf8');
    for (const block of nginx.match(/location [^{]+\{[^}]*\}/g) ?? []) {
      if (block.includes('/healthz')) continue;
      expect(block).toContain('include /etc/nginx/axentra/security-headers.conf;');
    }
  });
});
