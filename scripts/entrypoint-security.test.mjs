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
 * container. AXENTRA_API_URL and AXENTRA_PUBLIC_API_URL must be plain http(s) URLs (assessment
 * C-01: they go into proxy_pass, the CSP header line and config.json). The script runs as in the
 * image (POSIX sh), with /etc/nginx/ moved to a temp dir.
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
  const read = (name) => {
    const file = path.join(dir, 'axentra', name);
    return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  };
  return {
    status: result.status,
    stderr: result.stderr,
    headers: read('security-headers.conf'),
    config: read('config.json'),
    proxy: read('api-proxy.conf'),
  };
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

  // Assessment C-01
  it.each([
    ['https://api.example.com', 'https://api.example.com'],
    ['https://api.example.com/v1/', 'https://api.example.com'],
    ['http://localhost:8080', 'http://localhost:8080'],
    ['https://example.com/axentra-api', 'https://example.com/axentra-api'],
  ])('accepts AXENTRA_PUBLIC_API_URL=%j', (value, expected) => {
    const { status, headers, config } = run({ AXENTRA_PUBLIC_API_URL: value });
    expect(status).toBe(0);
    expect(csp(headers)).toContain(`connect-src 'self' ${expected};`);
    expect(JSON.parse(config)).toEqual({ apiBaseUrl: expected });
  });

  // Assessment C-01
  it.each([
    ['http://api:8080', 'http://api:8080'],
    ['http://127.0.0.1:8080/v1', 'http://127.0.0.1:8080'],
    ['https://api.internal/prefix/', 'https://api.internal/prefix'],
  ])('accepts AXENTRA_API_URL=%j', (value, expected) => {
    const { status, proxy } = run({ AXENTRA_API_URL: value });
    expect(status).toBe(0);
    expect(proxy).toContain(`proxy_pass ${expected};`);
  });

  // Assessment C-01: CSP directives, nginx variables and nginx directives must not get through.
  const badUrls = [
    'https://api.example.com;\tscript-src-elem\t*',
    'https://api.example.com; script-src-elem *',
    'https://api.example.com$http_x_inject',
    'http://127.0.0.1:9; add_header X-Injected yes always',
    'http://127.0.0.1:9;add_header X-Injected yes always',
    'https://api.example.com\nadd_header X-Evil 1;',
    'https://api.example.com\r',
    'https://api.example.com\tx',
    'https://api.example.com" always; add_header X-Evil "1',
    "https://api.example.com'unsafe-inline'",
    'https://api.example.com/${x}',
    'https://api.example.com/{a}',
    'https://api.example.com/#x',
    'https://api.example.com/?a=b',
    'https://api.example.com\\',
    'https://user@api.example.com',
    'https://*.example.com',
    'https://api.example.com:80x',
    'https://',
    'ftp://api.example.com',
    'api.example.com',
    ' https://api.example.com',
  ];
  it.each(badUrls)('refuses AXENTRA_PUBLIC_API_URL=%j and stops the start', (value) => {
    const { status, stderr, headers, config } = run({ AXENTRA_PUBLIC_API_URL: value });
    expect(status).not.toBe(0);
    expect(stderr).toContain('AXENTRA_PUBLIC_API_URL');
    expect(headers).toBeNull();
    expect(config).toBeNull();
  });
  it.each(badUrls)('refuses AXENTRA_API_URL=%j and stops the start', (value) => {
    const { status, stderr, proxy } = run({ AXENTRA_API_URL: value });
    expect(status).not.toBe(0);
    expect(stderr).toContain('AXENTRA_API_URL');
    expect(proxy).toBeNull();
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
