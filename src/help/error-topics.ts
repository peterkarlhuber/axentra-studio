import type { HelpTopic } from './manifest';

/** Problem codes with their own section in the troubleshooting article (anchor = kebab case). */
const CODES_WITH_SECTION = new Set([
  'validation_failed',
  'bad_request',
  'unauthenticated',
  'forbidden',
  'reauthentication_required',
  'not_found',
  'module_disabled',
  'conflict',
  'idempotency_conflict',
  'mode_not_supported',
  'payment_provider_not_configured',
  'precondition_failed',
  'payload_too_large',
  'unsupported_media_type',
  'rate_limited',
  'quota_exceeded',
  'internal',
  'network_error',
]);

/** Codes explained in the article of their feature rather than in troubleshooting. */
const FEATURE_TOPICS: Record<string, HelpTopic> = {
  api_key_creator_lost_access: 'api-keys#creator-permissions' as HelpTopic,
};

/** Problem reasons (`reason`) explained in the article of their feature. */
const REASON_TOPICS: Record<string, HelpTopic> = {
  query_too_expensive: 'search#too-expensive' as HelpTopic,
  last_sign_in_method: 'users#unlink-identity' as HelpTopic,
};

/**
 * The help section for an error code, or for its `reason` where that has its own section
 * (unknown codes get the general troubleshooting section).
 */
export function errorTopic(code: string | undefined, reason?: string): HelpTopic {
  if (reason && REASON_TOPICS[reason]) return REASON_TOPICS[reason];
  if (code && FEATURE_TOPICS[code]) return FEATURE_TOPICS[code];
  if (code && CODES_WITH_SECTION.has(code)) {
    return `troubleshooting#${code.replace(/_/g, '-')}` as HelpTopic;
  }
  return 'troubleshooting#unknown';
}
