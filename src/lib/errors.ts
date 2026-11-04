import type { TFunction } from 'i18next';
import { formatIssueLocation, toApiError, type ApiError } from '@/api/errors';

export interface DescribedError {
  error: ApiError;
  title: string;
  message: string;
  requestId: string | undefined;
  issues: { field: string; message: string }[];
}

/**
 * Map any thrown value to translated, user-facing text. The stable problem `code` selects
 * the message; the server's free-text `detail` is shown only as secondary information.
 */
export function describeError(t: TFunction, raw: unknown): DescribedError {
  const error = toApiError(raw);
  const key = `errors:codes.${error.code}`;
  const title = t(`${key}.title`, { defaultValue: t('errors:codes.unknown.title') });
  // "Correct the fields marked below" would point at nothing when the server names no field
  // (for example a password policy refusal): then the message only points to the server text.
  const messageKey =
    error.code === 'validation_failed' && error.errors.length === 0
      ? `${key}.messageNoFields`
      : error.code === 'api_key_creator_lost_access' && !error.permission
        ? `${key}.messageNoPermission`
        : `${key}.message`;
  const message = t(messageKey, {
    defaultValue: t('errors:codes.unknown.message'),
    // Problem-specific values the message names (formatted by i18next in the UI language).
    periodStart: error.periodStart ? new Date(error.periodStart) : undefined,
    permission: error.permission,
  });
  return {
    error,
    title,
    message,
    requestId: error.requestId,
    issues: error.errors.map((issue) => ({
      field: formatIssueLocation(issue.loc),
      message: issue.msg,
    })),
  };
}

/** Field-level validation messages keyed by the last path segment (e.g. "email"). */
export function fieldErrors(raw: unknown): Record<string, string> {
  const error = toApiError(raw);
  const result: Record<string, string> = {};
  for (const issue of error.errors) {
    const field = formatIssueLocation(issue.loc).split('.').pop() ?? '';
    if (field && !result[field]) result[field] = issue.msg;
  }
  return result;
}
