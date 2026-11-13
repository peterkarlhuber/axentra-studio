import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Assessment C-04: the production build (which the Docker image serves from /assets/) must not
 * emit source maps, so nginx has no `.map` files to hand out.
 */
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('vite.config.ts', () => {
  it('builds without source maps', () => {
    const config = fs.readFileSync(path.join(root, 'vite.config.ts'), 'utf8');
    const build = /\n {4}build: \{([\s\S]*?)\n {4}\},/.exec(config)?.[1] ?? '';
    expect(build).toMatch(/\n {6}sourcemap: false,/);
    expect(config.match(/sourcemap:/g)).toHaveLength(1);
  });
});
