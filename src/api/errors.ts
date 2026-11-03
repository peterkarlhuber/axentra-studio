/**
 * RFC 9457 problem details as returned by Axentra, normalized into `ApiError`.
 */
export interface ValidationIssue {
  loc: (string | number)[] | string;
  msg: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  code?: string;
  detail?: string;
  request_id?: string;
  errors?: ValidationIssue[];
  /** `backdating_not_permitted`: the earliest allowed `occurred_at` (start of the billing period). */
  period_start?: string;
}

/**
 * Every `code` the Axentra API can answer with (Axentra docs/architecture/API_CONVENTIONS.md,
 * `axentra.core.errors` and the HTTP error handlers), plus two client-side codes
 * (`network_error`, `unknown`). Each has a title and message in `errors.json`.
 */
export const KNOWN_ERROR_CODES = [
  'bad_request',
  'validation_failed',
  'invalid_signature',
  'unauthenticated',
  'forbidden',
  'reauthentication_required',
  'not_found',
  'module_disabled',
  'method_not_allowed',
  'conflict',
  'setup_already_completed',
  'email_taken',
  'mode_not_supported',
  'payment_provider_not_configured',
  'precondition_failed',
  'payload_too_large',
  'unsupported_media_type',
  'rate_limited',
  'quota_exceeded',
  'backdating_not_permitted',
  'internal',
  // A framework-level HTTP error without a more specific code.
  'error',
  'network_error',
  'unknown',
] as const;

export type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

const STATUS_TO_CODE: Record<number, KnownErrorCode> = {
  400: 'validation_failed',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  405: 'method_not_allowed',
  409: 'conflict',
  412: 'precondition_failed',
  413: 'payload_too_large',
  415: 'unsupported_media_type',
  422: 'validation_failed',
  429: 'rate_limited',
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string | undefined;
  readonly detail: string | undefined;
  readonly requestId: string | undefined;
  readonly errors: ValidationIssue[];
  /** Start of the tenant's current billing period (`backdating_not_permitted` only). */
  readonly periodStart: string | undefined;

  constructor(init: {
    status: number;
    code: string;
    title?: string;
    detail?: string;
    requestId?: string;
    errors?: ValidationIssue[];
    periodStart?: string;
  }) {
    super(init.detail || init.title || init.code);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.title = init.title;
    this.detail = init.detail;
    this.requestId = init.requestId;
    this.errors = init.errors ?? [];
    this.periodStart = init.periodStart;
  }

  get isUnauthenticated(): boolean {
    return this.status === 401 || this.code === 'unauthenticated';
  }

  get isForbidden(): boolean {
    return this.status === 403 || this.code === 'forbidden';
  }

  get isNotFound(): boolean {
    return this.status === 404 || this.code === 'not_found';
  }
}

/**
 * `409` from an endpoint that takes an `Idempotency-Key` (job enqueue, event publish,
 * notification send, usage record): the key was already used for a different request or by
 * another caller (SECURITY_MODEL.md rule 11). Retrying needs a new key. Only use it for
 * those endpoints, whose only `409` this is.
 */
export function isIdempotencyConflict(error: unknown): boolean {
  return isApiError(error) && error.status === 409;
}

/** `403 reauthentication_required`: the action needs a recent sign-in (e.g. a first password). */
export function isReauthenticationRequired(error: unknown): boolean {
  return isApiError(error) && error.code === 'reauthentication_required';
}

export function codeForStatus(status: number): KnownErrorCode {
  if (STATUS_TO_CODE[status]) return STATUS_TO_CODE[status];
  if (status >= 500) return 'internal';
  return 'unknown';
}

/** Build an ApiError from a parsed body (problem+json or anything else) and the response. */
export function problemToError(body: unknown, response: Response | undefined): ApiError {
  const status = response?.status ?? 0;
  const problem: ProblemDetails = body && typeof body === 'object' ? (body as ProblemDetails) : {};
  const requestId = problem.request_id ?? response?.headers.get('X-Request-ID') ?? undefined;
  return new ApiError({
    status: problem.status ?? status,
    code: typeof problem.code === 'string' && problem.code ? problem.code : codeForStatus(status),
    title: problem.title,
    detail: typeof body === 'string' && body ? body : problem.detail,
    requestId,
    errors: Array.isArray(problem.errors) ? problem.errors : [],
    periodStart: typeof problem.period_start === 'string' ? problem.period_start : undefined,
  });
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError({ status: 0, code: 'network_error', detail: 'aborted' });
  }
  return new ApiError({
    status: 0,
    code: 'network_error',
    detail: error instanceof Error ? error.message : undefined,
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function formatIssueLocation(loc: ValidationIssue['loc']): string {
  if (typeof loc === 'string') return loc;
  // FastAPI-style locations start with "body"/"query"; drop that prefix for display.
  const parts = loc[0] === 'body' || loc[0] === 'query' || loc[0] === 'path' ? loc.slice(1) : loc;
  return parts.join('.');
}
