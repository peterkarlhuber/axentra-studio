/// <reference types="node" />
// Read from disk: Vitest's CSS handling turns `?raw` CSS imports into empty strings.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { contrastRatio } from '@/lib/contrast';

const tokensCss = readFileSync(resolve(process.cwd(), 'src/styles/tokens.css'), 'utf8');

/** Extract `--name: #hex;` declarations from a CSS block. */
function parseBlock(css: string, selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`Selector not found: ${selector}`);
  const end = css.indexOf('\n}', start);
  const block = css.slice(start, end);
  const tokens: Record<string, string> = {};
  for (const match of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    tokens[match[1] as string] = match[2] as string;
  }
  return tokens;
}

const light = parseBlock(tokensCss, ':root');
const dark = { ...light, ...parseBlock(tokensCss, ":root[data-theme='dark']") };

const TEXT_AA = 4.5;
const UI_AA = 3; // non-text contrast (WCAG 1.4.11) and large text

/** [foreground, background, minimum ratio] */
const PAIRS: [string, string, number][] = [
  ['ax-color-text', 'ax-color-bg', TEXT_AA],
  ['ax-color-text', 'ax-color-surface', TEXT_AA],
  ['ax-color-text', 'ax-color-surface-2', TEXT_AA],
  ['ax-color-heading', 'ax-color-surface', TEXT_AA],
  ['ax-color-text-muted', 'ax-color-surface', TEXT_AA],
  ['ax-color-text-muted', 'ax-color-bg', TEXT_AA],
  ['ax-color-text-muted', 'ax-color-surface-2', TEXT_AA],
  ['ax-color-text-subtle', 'ax-color-surface', TEXT_AA],
  ['ax-color-link', 'ax-color-surface', TEXT_AA],
  ['ax-color-link', 'ax-color-bg', TEXT_AA],
  ['ax-color-link', 'ax-color-primary-subtle', TEXT_AA],
  ['ax-color-on-primary', 'ax-color-primary', TEXT_AA],
  ['ax-color-on-primary', 'ax-color-primary-hover', TEXT_AA],
  ['ax-color-on-danger', 'ax-color-danger', TEXT_AA],
  ['ax-color-success', 'ax-color-success-bg', TEXT_AA],
  ['ax-color-warning', 'ax-color-warning-bg', TEXT_AA],
  ['ax-color-danger', 'ax-color-danger-bg', TEXT_AA],
  ['ax-color-info', 'ax-color-info-bg', TEXT_AA],
  ['ax-color-neutral', 'ax-color-neutral-bg', TEXT_AA],
  ['ax-color-danger', 'ax-color-surface', TEXT_AA],
  ['ax-color-focus', 'ax-color-bg', UI_AA],
  ['ax-color-focus', 'ax-color-surface', UI_AA],
  ['ax-color-control-border', 'ax-color-surface', UI_AA],
  // Sidebar is navy in both themes.
  ['ax-sidebar-text', 'ax-sidebar-bg', TEXT_AA],
  ['ax-sidebar-text-muted', 'ax-sidebar-bg', TEXT_AA],
  ['ax-sidebar-text-active', 'ax-sidebar-bg', TEXT_AA],
  ['ax-sidebar-indicator', 'ax-sidebar-bg', UI_AA],
];

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme tokens', (_name, tokens) => {
  it.each(PAIRS)('%s on %s meets %d:1', (fg, bg, minimum) => {
    const foreground = tokens[fg];
    const background = tokens[bg];
    expect(foreground, `missing token --${fg}`).toBeDefined();
    expect(background, `missing token --${bg}`).toBeDefined();
    expect(contrastRatio(foreground as string, background as string)).toBeGreaterThanOrEqual(
      minimum,
    );
  });
});

describe('contrastRatio', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#767676', '#ffffff')).toBeGreaterThan(4.5);
  });

  it('rejects malformed colors', () => {
    expect(() => contrastRatio('red', '#ffffff')).toThrow();
  });
});
