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
}

/** Stable codes from API_CONVENTIONS plus two client-side codes. */
export const KNOWN_ERROR_CODES = [
  'validation_failed',
  'unauthenticated',
  'forbidden',
  'not_found',
  'conflict',
  'precondition_failed',
  'rate_limited',
  'quota_exceeded',
  'mode_not_supported',
  'internal',
  'network_error',
  'unknown',
] as const;

export type KnownErrorCode = (typeof KNOWN_ERROR_CODES)[number];

const STATUS_TO_CODE: Record<number, KnownErrorCode> = {
  400: 'validation_failed',
  401: 'unauthenticated',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  412: 'precondition_failed',
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

  constructor(init: {
    status: number;
    code: string;
    title?: string;
    detail?: string;
    requestId?: string;
    errors?: ValidationIssue[];
  }) {
    super(init.detail || init.title || init.code);
    this.name = 'ApiError';
    this.status = init.status;
    this.code = init.code;
    this.title = init.title;
    this.detail = init.detail;
    this.requestId = init.requestId;
    this.errors = init.errors ?? [];
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
