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

/** The troubleshooting section for an error code (unknown codes get the general section). */
export function errorTopic(code: string | undefined): HelpTopic {
  if (code && CODES_WITH_SECTION.has(code)) {
    return `troubleshooting#${code.replace(/_/g, '-')}` as HelpTopic;
  }
  return 'troubleshooting#unknown';
}
