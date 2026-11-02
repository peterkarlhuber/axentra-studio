import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Security review round 4, R4-2: the first request of an emailed link
 * (`GET /invitations/accept?token=...`) reaches nginx before Studio removes the token from the
 * address bar, and the `/v1` proxy forwards the OIDC callback (`?code=...&state=...`). The
 * image's access log must therefore record no query string (and no `Referer`), only the path.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const dockerFiles = fs
  .readdirSync(path.join(root, 'docker'))
  .map((name) => `docker/${name}`)
  .concat('Dockerfile');

const nginx = read('docker/nginx.conf');
const logFormat = /log_format\s+axentra_studio\s+((?:'[^']*'\s*)+);/.exec(nginx);
const mapBlock = /map\s+\$request_uri\s+\$axentra_log_path\s*\{([^}]*)\}/.exec(nginx);

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

  it('keeps only the path before the first "?"', () => {
    expect(mapBlock).not.toBeNull();
    const rule = /"~\^\(\?<axentra_path>([^"]*)\)"\s+\$axentra_path;/.exec(mapBlock[1]);
    expect(rule).not.toBeNull();
    const pattern = new RegExp(`^(?<p>${rule[1]})`);
    const logged = (uri) => pattern.exec(uri)?.groups?.p;
    const token = 'axinv_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefg';
    for (const [uri, expected] of [
      [`/invitations/accept?token=${token}`, '/invitations/accept'],
      [`/invitations/accept/?TOKEN=${encodeURIComponent(token)}#x`, '/invitations/accept/'],
      [`/login?return_to=%2Finvitations%2Faccept%3Ftoken%3D${token}`, '/login'],
      ['/setup?token=s3cr3t', '/setup'],
      ['/v1/auth/oidc/test/callback?code=c0de&state=st4te', '/v1/auth/oidc/test/callback'],
      ['/assets/index-abc.js', '/assets/index-abc.js'],
    ]) {
      expect(logged(uri)).toBe(expected);
    }
  });
});
