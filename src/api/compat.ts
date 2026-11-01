import type { ApiVersionValue } from './models';

/** The API version this Studio build was written against. */
export const REQUIRED_API = { major: 1, minor: 0 } as const;

export interface ApiVersion {
  major: number;
  minor: number;
}

export function parseApiVersion(value: ApiVersionValue | null | undefined): ApiVersion | null {
  if (value == null) return null;
  if (typeof value === 'object') {
    const { major, minor } = value;
    if (Number.isInteger(major) && Number.isInteger(minor)) return { major, minor };
    return null;
  }
  const match = /^v?(\d+)\.(\d+)/.exec(String(value).trim());
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]) };
}

export type CompatibilityResult =
  | { ok: true; server: ApiVersion; required: ApiVersion }
  | {
      ok: false;
      reason: 'major_mismatch' | 'minor_too_low' | 'unparseable';
      server: ApiVersion | null;
      raw: string;
      required: ApiVersion;
    };

export function formatApiVersion(version: ApiVersion): string {
  return `${version.major}.${version.minor}`;
}

export function checkCompatibility(
  value: ApiVersionValue | null | undefined,
  required: ApiVersion = REQUIRED_API,
): CompatibilityResult {
  const server = parseApiVersion(value);
  const raw = typeof value === 'object' && value ? JSON.stringify(value) : String(value ?? '');
  if (!server) return { ok: false, reason: 'unparseable', server: null, raw, required };
  if (server.major !== required.major) {
    return { ok: false, reason: 'major_mismatch', server, raw, required };
  }
  if (server.minor < required.minor) {
    return { ok: false, reason: 'minor_too_low', server, raw, required };
  }
  return { ok: true, server, required };
}
