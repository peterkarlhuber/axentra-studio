import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Security review round 4, R4-2: the first request of an emailed link
 * (`GET /invitations/accept?token=...`) reaches nginx before Studio removes the token from the
 * address bar, and the `/v1` proxy forwards the OIDC callback (`?code=...&state=...`). The
 * image's access log must therefore record no query string (and no `Referer`), only the path,
 * and no signed download token from the path (assessment B-01).
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const dockerFiles = fs
  .readdirSync(path.join(root, 'docker'))
  .map((name) => `docker/${name}`)
  .concat('Dockerfile');

const nginx = read('docker/nginx.conf');
const logFormat = /log_format\s+axentra_studio\s+((?:'[^']*'\s*)+);/.exec(nginx);
const mapBlock = /map\s+\$request_uri\s+\$axentra_log_path\s*\{([\s\S]*?)\n\}/.exec(nginx);

describe('nginx access log', () => {
  it('defines a format without the query string or the Referer', () => {
    expect(logFormat).not.toBeNull();
    const format = logFormat[1];
    expect(format).toContain('$request_method $axentra_log_path $server_protocol');
    for (const variable of [
      '$request ',
      '$request"',
      '$request_uri',
      '$query_string',
      '$args',
      '$arg_',
      '$is_args',
      '$http_referer',
      '$uri',
    ]) {
      expect(format).not.toContain(variable);
    }
  });

  it('logs every request of the server with that format', () => {
    const server = nginx.slice(nginx.indexOf('server {'));
    expect(server).toMatch(/^\s{4}access_log \/var\/log\/nginx\/access\.log axentra_studio;$/m);
    // No other access_log in the image may log with another (default: combined) format.
    for (const file of dockerFiles) {
      for (const [, args] of read(file).matchAll(/access_log\s+([^;]+);/g)) {
        expect(
          args === 'off' || /\saxentra_studio$/.test(args),
          `${file}: access_log ${args}`,
        ).toBe(true);
      }
    }
  });

  /**
   * The map's rules, evaluated like nginx: regexes in order of appearance (`~*` ignores case),
   * the first match wins and its value may use the named captures.
   */
  function logged(uri) {
    for (const [, flags, pattern, value] of mapBlock[1].matchAll(
      /^\s*"~(\*?)([^"]*)"\s+("[^"]*"|\$\w+);$/gm,
    )) {
      const match = new RegExp(pattern, flags ? 'i' : '').exec(uri);
      if (!match) continue;
      return value
        .replace(/^"|"$/g, '')
        .replace(/\$\{?(\w+)\}?/g, (_, name) => match.groups?.[name] ?? '');
    }
    return '-';
  }

  it('keeps only the path before the first "?"', () => {
    expect(mapBlock).not.toBeNull();
    const token = 'axinv_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefg';
    for (const [uri, expected] of [
      [`/invitations/accept?token=${token}`, '/invitations/accept'],
      [`/invitations/accept/?TOKEN=${encodeURIComponent(token)}#x`, '/invitations/accept/'],
      [`/login?return_to=%2Finvitations%2Faccept%3Ftoken%3D${token}`, '/login'],
      ['/setup?token=s3cr3t', '/setup'],
      ['/v1/auth/oidc/test/callback?code=c0de&state=st4te', '/v1/auth/oidc/test/callback'],
      ['/assets/index-abc.js', '/assets/index-abc.js'],
      ['/v1/files/f_123/download-url', '/v1/files/f_123/download-url'],
    ]) {
      expect(logged(uri)).toBe(expected);
    }
  });

  // Assessment B-01: the /v1 proxy sees signed download links with the token in the path.
  it('masks signed download tokens, however the path is spelled', () => {
    const token = 'd1.k1.eyJmaWxlIjoiZl8xMjMiLCJleHAiOjE3MDAwMDAwMDB9.c2lnbmF0dXJlX21hYw';
    for (const uri of [
      `/v1/files/download/${token}`,
      `/v1/files/download/${token}?inline=1`,
      `/V1/Files/Download/${token}`,
      `/v1//files//download/${token}`,
      `/v1/files/%64ownload/${token}`,
      `/v1/files/download/%64%31%2e${token.slice(3)}`,
      `/v1/files%2Fdownload%2F${token}`,
      `/v1/files/./download/${token}`,
      `/v1/files/download/../download/${token}`,
    ]) {
      const line = logged(uri);
      expect(line, uri).toContain('[redacted]');
      expect(line, uri).not.toMatch(/eyJ|c2ln/);
    }
    expect(logged(`/v1/files/download/${token}`)).toBe('/v1/files/download/[redacted]');
    expect(logged(`/v1/files/%64ownload/${token}`)).toBe('/v1/files/%64ownload/[redacted]');
  });
});
