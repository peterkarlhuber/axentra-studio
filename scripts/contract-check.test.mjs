import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { readPinnedRef, readSourceSha, serializeContract } from './contract-check.mjs';

describe('contract check', () => {
  it('pins the same backend commit the vendored contract was synced from', () => {
    const pinned = readPinnedRef(fs.readFileSync('api/BACKEND_REF', 'utf8'));
    expect(readSourceSha(fs.readFileSync('api/SOURCE', 'utf8'))).toBe(pinned);
  });

  it('rejects anything but a full commit SHA', () => {
    expect(() => readPinnedRef('main')).toThrow(/40-character/);
    expect(() => readPinnedRef('a2ca72a')).toThrow(/40-character/);
    expect(readPinnedRef(`${'a'.repeat(40)}\n`)).toBe('a'.repeat(40));
  });

  it('keeps api/openapi.json in the exact format api:sync writes', () => {
    const text = fs.readFileSync('api/openapi.json', 'utf8');
    expect(serializeContract(JSON.parse(text))).toBe(text);
  });
});
