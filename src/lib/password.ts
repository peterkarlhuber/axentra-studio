import type { TFunction } from 'i18next';
import type { Meta } from '@/api/models';
import { toApiError } from '@/api/errors';

/** The server's password length limits (`GET /v1/meta`); servers before 2026-11 send none. */
export function passwordPolicy(meta: Meta): { min: number; max: number } {
  const policy = (meta.auth as { password_policy?: { min_length: number; max_length: number } })
    .password_policy;
  return { min: policy?.min_length ?? 12, max: policy?.max_length ?? 1024 };
}

const REASONS = ['too_short', 'too_long', 'equals_email', 'too_simple'] as const;

/**
 * A translated message for a `422` password policy refusal (by its `reason`), or undefined for
 * any other error. The server also names the field in `errors`, so `fieldErrors` finds it; this
 * replaces the English text there.
 */
export function passwordRefusal(
  t: TFunction,
  error: unknown,
  policy: { min: number; max: number },
): string | undefined {
  if (!error) return undefined;
  const reason = toApiError(error).reason;
  if (!reason || !(REASONS as readonly string[]).includes(reason)) return undefined;
  return t(`common:passwordPolicy.${reason}`, policy);
}
