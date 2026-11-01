/**
 * CSRF token holder. The token comes from `GET /v1/auth/session` (or the login response) and
 * is kept in memory only: never persisted to storage, so it cannot leak across tabs or reloads.
 */
let csrfToken: string | null = null;

export function setCsrfToken(token: string | null | undefined): void {
  csrfToken = token ?? null;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

export const CSRF_HEADER = 'X-Axentra-CSRF';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function needsCsrf(method: string): boolean {
  return !SAFE_METHODS.has(method.toUpperCase());
}
