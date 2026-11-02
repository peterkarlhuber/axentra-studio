import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Security review round 3, NF-3: an invitation token may be in the address bar for a moment
 * (the emailed link), so no request may carry the page URL as `Referer` - not to other origins
 * and not to the same origin either (a same-origin proxy such as the image's nginx logs the
 * `Referer` in its combined access log). The meta element wins over the response header once it
 * is parsed, so both must say `no-referrer`.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

describe('Referrer-Policy', () => {
  it('index.html sets no-referrer before any script, style or icon is requested', () => {
    const html = read('index.html');
    const metas = [...html.matchAll(/<meta\s+name="referrer"\s+content="([^"]*)"/g)].map(
      (m) => m[1],
    );
    expect(metas).toEqual(['no-referrer']);
    const metaAt = html.indexOf('name="referrer"');
    for (const tag of ['<link', '<script']) expect(html.indexOf(tag)).toBeGreaterThan(metaAt);
  });

  it('the Docker image sends Referrer-Policy: no-referrer on every Studio response', () => {
    const script = read('docker/40-axentra-studio.sh');
    expect(script).toContain('add_header Referrer-Policy "no-referrer" always;');
    const nginx = read('docker/nginx.conf');
    // Every location that serves Studio files includes the generated security headers.
    const locations = nginx.match(/location [^{]+\{[^}]*\}/g) ?? [];
    for (const block of locations) {
      if (block.includes('/healthz')) continue;
      expect(block).toContain('include /etc/nginx/axentra/security-headers.conf;');
    }
  });

  it('the dev and preview servers send the same header', () => {
    const config = read('vite.config.ts');
    expect(config).toMatch(/'Referrer-Policy': 'no-referrer'/);
    expect(config).toMatch(/server: \{[^}]*headers: securityHeaders/);
    expect(config).toMatch(/preview: \{[^}]*headers: securityHeaders/);
  });
});
