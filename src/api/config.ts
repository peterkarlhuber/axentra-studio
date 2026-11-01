/**
 * Runtime configuration.
 *
 * A built Studio reads `/config.json` (a static file next to index.html) at startup, so the
 * same bundle can talk to the API on the same origin (default) or on a separate origin.
 */
export interface RuntimeConfig {
  /**
   * Origin of the Axentra API without the `/v1` suffix, e.g. `https://api.example.com`.
   * Empty string means same origin (the dev server or a reverse proxy forwards `/v1`).
   */
  apiBaseUrl: string;
}

export const DEFAULT_CONFIG: RuntimeConfig = { apiBaseUrl: '' };

export function normalizeConfig(raw: unknown): RuntimeConfig {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_CONFIG };
  const value = (raw as Record<string, unknown>).apiBaseUrl;
  if (typeof value !== 'string') return { ...DEFAULT_CONFIG };
  // Strip trailing slashes and an accidental `/v1` suffix: API paths already start with `/v1`.
  const apiBaseUrl = value.trim().replace(/\/+$/, '').replace(/\/v1$/, '');
  return { apiBaseUrl };
}

export async function loadRuntimeConfig(
  fetchImpl: typeof fetch = globalThis.fetch.bind(globalThis),
): Promise<RuntimeConfig> {
  try {
    const response = await fetchImpl('/config.json', {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return { ...DEFAULT_CONFIG };
    return normalizeConfig(await response.json());
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}
