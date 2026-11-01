import { describe, expect, it, vi } from 'vitest';
import { jsonResponse } from '@/test/utils';
import { loadRuntimeConfig, normalizeConfig } from './config';

describe('normalizeConfig', () => {
  it('defaults to the same origin', () => {
    expect(normalizeConfig(null)).toEqual({ apiBaseUrl: '' });
    expect(normalizeConfig({})).toEqual({ apiBaseUrl: '' });
    expect(normalizeConfig({ apiBaseUrl: 42 })).toEqual({ apiBaseUrl: '' });
  });
  it('strips trailing slashes and a /v1 suffix', () => {
    expect(normalizeConfig({ apiBaseUrl: ' https://api.example.com/ ' })).toEqual({
      apiBaseUrl: 'https://api.example.com',
    });
    expect(normalizeConfig({ apiBaseUrl: 'https://api.example.com/v1/' })).toEqual({
      apiBaseUrl: 'https://api.example.com',
    });
  });
});

describe('loadRuntimeConfig', () => {
  it('reads /config.json', async () => {
    const fetch = vi.fn(async () => jsonResponse({ apiBaseUrl: 'https://api.test' }));
    await expect(loadRuntimeConfig(fetch)).resolves.toEqual({ apiBaseUrl: 'https://api.test' });
    expect(fetch).toHaveBeenCalledWith(
      '/config.json',
      expect.objectContaining({ cache: 'no-store' }),
    );
  });
  it('falls back to defaults when the file is missing or broken', async () => {
    await expect(loadRuntimeConfig(async () => new Response('', { status: 404 }))).resolves.toEqual(
      {
        apiBaseUrl: '',
      },
    );
    await expect(
      loadRuntimeConfig(async () => {
        throw new TypeError('offline');
      }),
    ).resolves.toEqual({ apiBaseUrl: '' });
  });
});
