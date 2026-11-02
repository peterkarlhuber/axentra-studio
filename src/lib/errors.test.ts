import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { ApiError, codeForStatus, formatIssueLocation } from '@/api/errors';
import { describeError, fieldErrors } from './errors';

const t = i18n.getFixedT('en');
const tDe = i18n.getFixedT('de');

// German is loaded on demand (only English is bundled).
beforeAll(() => i18n.loadLanguages('de'));

describe('describeError', () => {
  it('translates by stable code and keeps the request id', () => {
    const described = describeError(
      t,
      new ApiError({ status: 409, code: 'conflict', detail: 'raw', requestId: 'req-9' }),
    );
    expect(described.title).toBe(t('errors:codes.conflict.title'));
    expect(described.title).not.toMatch(/^errors:/);
    expect(described.requestId).toBe('req-9');
    expect(tDe('errors:codes.conflict.title')).not.toBe(described.title);
  });

  it('falls back to the unknown message for unexpected codes', () => {
    const described = describeError(t, new ApiError({ status: 418, code: 'teapot' }));
    expect(described.title).toBe(t('errors:codes.unknown.title'));
  });

  it('treats arbitrary throwables as network errors', () => {
    expect(describeError(t, new TypeError('boom')).error.code).toBe('network_error');
  });

  it('lists validation issues with readable locations', () => {
    const error = new ApiError({
      status: 422,
      code: 'validation_failed',
      errors: [
        { loc: ['body', 'email'], msg: 'invalid email' },
        { loc: 'name', msg: 'required' },
      ],
    });
    expect(describeError(t, error).issues).toEqual([
      { field: 'email', message: 'invalid email' },
      { field: 'name', message: 'required' },
    ]);
    expect(fieldErrors(error)).toEqual({ email: 'invalid email', name: 'required' });
  });

  it('has a translation for every known code in both languages', async () => {
    const { KNOWN_ERROR_CODES } = await import('@/api/errors');
    for (const code of KNOWN_ERROR_CODES) {
      for (const tr of [t, tDe]) {
        expect(tr(`errors:codes.${code}.title`)).not.toContain('codes.');
        expect(tr(`errors:codes.${code}.message`)).not.toContain('codes.');
      }
    }
  });
});

describe('error helpers', () => {
  it('maps status codes', () => {
    expect(codeForStatus(403)).toBe('forbidden');
    expect(codeForStatus(503)).toBe('internal');
    expect(codeForStatus(302)).toBe('unknown');
  });
  it('formats issue locations', () => {
    expect(formatIssueLocation(['query', 'limit'])).toBe('limit');
    expect(formatIssueLocation(['items', 0, 'name'])).toBe('items.0.name');
  });
});
