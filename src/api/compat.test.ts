import { describe, expect, it } from 'vitest';
import { checkCompatibility, formatApiVersion, parseApiVersion, REQUIRED_API } from './compat';

describe('parseApiVersion', () => {
  it('reads the contract object form', () => {
    expect(parseApiVersion({ major: 1, minor: 4 })).toEqual({ major: 1, minor: 4 });
  });
  it('accepts version strings defensively', () => {
    expect(parseApiVersion('1.2')).toEqual({ major: 1, minor: 2 });
    expect(parseApiVersion('v2.0.3')).toEqual({ major: 2, minor: 0 });
  });
  it('rejects garbage', () => {
    expect(parseApiVersion('latest')).toBeNull();
    expect(parseApiVersion(null)).toBeNull();
    expect(parseApiVersion({ major: 1.5, minor: 0 })).toBeNull();
  });
});

describe('checkCompatibility', () => {
  it('requires API 1.0', () => {
    expect(REQUIRED_API).toEqual({ major: 1, minor: 0 });
    expect(formatApiVersion(REQUIRED_API)).toBe('1.0');
  });
  it('accepts the same major with an equal or newer minor', () => {
    expect(checkCompatibility({ major: 1, minor: 0 }).ok).toBe(true);
    expect(checkCompatibility({ major: 1, minor: 7 }).ok).toBe(true);
  });
  it('rejects another major version', () => {
    expect(checkCompatibility({ major: 2, minor: 0 })).toMatchObject({
      ok: false,
      reason: 'major_mismatch',
    });
    expect(checkCompatibility({ major: 0, minor: 9 })).toMatchObject({ reason: 'major_mismatch' });
  });
  it('rejects an older minor version', () => {
    expect(checkCompatibility({ major: 1, minor: 1 }, { major: 1, minor: 2 })).toMatchObject({
      ok: false,
      reason: 'minor_too_low',
    });
  });
  it('reports unparseable versions with the raw value', () => {
    expect(checkCompatibility('nope')).toMatchObject({
      ok: false,
      reason: 'unparseable',
      raw: 'nope',
    });
  });
});
