import { beforeAll, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import {
  ApiError,
  KNOWN_ERROR_CODES,
  codeForStatus,
  formatIssueLocation,
  problemToError,
} from '@/api/errors';
import enErrors from '@/i18n/locales/en/errors.json';
import { describeError, fieldErrors } from './errors';

const t = i18n.getFixedT('en');
const tDe = i18n.getFixedT('de');
const LOCALES = ['en', 'de', 'es', 'fr', 'pt-BR', 'it'] as const;

// Other languages are loaded on demand (only English is bundled).
beforeAll(() => i18n.loadLanguages([...LOCALES]));

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

  it('does not point to marked fields when the server names none', () => {
    const withFields = new ApiError({
      status: 422,
      code: 'validation_failed',
      errors: [{ loc: ['body', 'email'], msg: 'invalid email' }],
    });
    const withoutFields = new ApiError({
      status: 422,
      code: 'validation_failed',
      detail: 'the password must have at least 12 characters',
    });
    expect(describeError(t, withFields).message).toBe(t('errors:codes.validation_failed.message'));
    expect(describeError(t, withoutFields).message).toBe(
      t('errors:codes.validation_failed.messageNoFields'),
    );
    for (const locale of LOCALES) {
      const tr = i18n.getFixedT(locale);
      expect(tr('errors:codes.validation_failed.messageNoFields')).not.toContain('codes.');
    }
  });

  it('names the permission an API key lost through its creator', () => {
    const response = new Response(null, { status: 403 });
    const error = problemToError(
      {
        status: 403,
        code: 'api_key_creator_lost_access',
        detail: 'the key creator no longer holds records:write',
        permission: 'records:write',
      },
      response,
    );
    expect(error.isForbidden).toBe(true);
    expect(error.permission).toBe('records:write');
    const described = describeError(t, error);
    expect(described.title).toBe('API key refused: its creator lost a permission');
    expect(described.message).toContain('the permission records:write');
    for (const locale of LOCALES) {
      const tr = i18n.getFixedT(locale);
      expect(describeError(tr, error).message).toContain('records:write');
    }
    // Without the field (older or unexpected answers) the message does not show a placeholder.
    const withoutField = describeError(
      t,
      new ApiError({ status: 403, code: 'api_key_creator_lost_access' }),
    );
    expect(withoutField.message).toBe(
      t('errors:codes.api_key_creator_lost_access.messageNoPermission'),
    );
    expect(withoutField.message).not.toContain('{{');
  });

  it('has a translation for every known code in all six languages', () => {
    for (const locale of LOCALES) {
      const tr = i18n.getFixedT(locale);
      for (const code of KNOWN_ERROR_CODES) {
        expect(tr(`errors:codes.${code}.title`)).not.toContain('codes.');
        expect(tr(`errors:codes.${code}.message`)).not.toContain('codes.');
      }
    }
  });

  it('prefers the text of a known problem reason over the general code text', () => {
    const tooExpensive = describeError(
      t,
      problemToError(
        {
          code: 'validation_failed',
          status: 422,
          detail: 'the search took too long; use more specific terms or a kind filter',
          reason: 'query_too_expensive',
        },
        new Response(null, { status: 422 }),
      ),
    );
    expect(tooExpensive.title).toBe('Search took too long');
    expect(tooExpensive.message).toMatch(/more specific terms or a kind filter/);
    expect(tooExpensive.error.reason).toBe('query_too_expensive');

    const lastMethod = describeError(
      t,
      new ApiError({ status: 409, code: 'conflict', reason: 'last_sign_in_method' }),
    );
    expect(lastMethod.title).toBe("The user's last way to sign in");
    expect(lastMethod.message).toMatch(/disable the user instead/);

    // A reason without its own text keeps the code's text (e.g. the invitation reasons, which
    // the accept page explains itself).
    const other = describeError(
      t,
      new ApiError({ status: 403, code: 'forbidden', reason: 'email_mismatch' }),
    );
    expect(other.title).toBe(t('errors:codes.forbidden.title'));
  });

  it('translates every problem reason in all six languages', () => {
    const reasons = Object.keys(enErrors.reasons);
    expect(reasons.sort()).toEqual(['last_sign_in_method', 'query_too_expensive']);
    for (const locale of LOCALES) {
      const tr = i18n.getFixedT(locale);
      for (const reason of reasons) {
        expect(tr(`errors:reasons.${reason}.title`)).not.toContain('reasons.');
        expect(tr(`errors:reasons.${reason}.message`)).not.toContain('reasons.');
      }
    }
  });

  it('lists exactly the codes that errors.json translates', () => {
    expect([...KNOWN_ERROR_CODES].sort()).toEqual(Object.keys(enErrors.codes).sort());
  });

  it.each([
    ['method_not_allowed', 405, 'Action not supported'],
    ['error', 400, 'Request failed'],
    ['setup_already_completed', 409, 'Setup is already complete'],
    ['email_taken', 409, 'Email address in use'],
  ])('maps the server code %s instead of "Unexpected error"', (code, status, title) => {
    const described = describeError(t, new ApiError({ status, code }));
    expect(described.title).toBe(title);
    expect(described.title).not.toBe(t('errors:codes.unknown.title'));
  });

  it('names the Stripe and mailbox cases of mode_not_supported', () => {
    const { message } = describeError(t, new ApiError({ status: 409, code: 'mode_not_supported' }));
    expect(message).toMatch(/Stripe/);
    expect(message).toMatch(/mailbox/);
  });
});

describe('error helpers', () => {
  it('maps status codes', () => {
    expect(codeForStatus(403)).toBe('forbidden');
    expect(codeForStatus(405)).toBe('method_not_allowed');
    expect(codeForStatus(413)).toBe('payload_too_large');
    expect(codeForStatus(503)).toBe('internal');
    expect(codeForStatus(302)).toBe('unknown');
  });
  it('formats issue locations', () => {
    expect(formatIssueLocation(['query', 'limit'])).toBe('limit');
    expect(formatIssueLocation(['items', 0, 'name'])).toBe('items.0.name');
  });

  it('names the start of the billing period when backdating is refused, in each language', () => {
    const error = problemToError(
      {
        type: 'urn:axentra:problem:backdating_not_permitted',
        status: 403,
        code: 'backdating_not_permitted',
        detail: 'occurred_at is before the current billing period',
        period_start: '2026-11-01T00:00:00Z',
      },
      new Response(null, { status: 403 }),
    );
    expect(error.periodStart).toBe('2026-11-01T00:00:00Z');
    const when = (locale: string) =>
      new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date('2026-11-01T00:00:00Z'),
      );
    const en = describeError(t, error);
    expect(en.title).toBe('Before the billing period');
    expect(en.message).toContain(when('en'));
    expect(en.message).toContain('usage:manage');
    for (const locale of LOCALES) {
      const message = describeError(i18n.getFixedT(locale), error).message;
      expect(message).toContain(when(locale));
      expect(message).not.toContain('{{');
    }
  });
});
