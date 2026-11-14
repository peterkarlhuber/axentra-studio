import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Assessment C-04: the production build (which the Docker image serves from /assets/) must not
 * emit source maps, and the image's nginx refuses `/assets/*.map` as a backstop.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('vite.config.ts', () => {
  it('builds without source maps', () => {
    const config = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
    const build = /\n {4}build: \{([\s\S]*?)\n {4}\},/.exec(config)?.[1] ?? '';
    expect(build).toMatch(/\n {6}sourcemap: false,/);
    expect(config.match(/sourcemap:/g)).toHaveLength(1);
  });

  it('the image refuses source maps even if a build has them', () => {
    const nginx = fs.readFileSync(path.join(root, 'docker/nginx.conf'), 'utf8');
    expect(nginx).toMatch(
      /location ~ \^\/assets\/\.\*\\\.map\$ \{\s*include \/etc\/nginx\/axentra\/security-headers\.conf;\s*return 404;\s*\}/,
    );
  });
});
