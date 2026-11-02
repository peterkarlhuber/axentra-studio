import createClient, { type Client, type Middleware } from 'openapi-fetch';
import { CSRF_HEADER, getCsrfToken, needsCsrf } from './csrf';
import { REQUIRED_API } from './compat';
import { problemToError, toApiError } from './errors';
import type { paths } from './schema';

export type AxentraClient = Client<paths>;

export const STUDIO_VERSION: string =
  typeof __STUDIO_VERSION__ === 'string' ? __STUDIO_VERSION__ : '0.0.0-dev';

/** `Axentra-Client` header as described in API_CONVENTIONS "Base path and versioning". */
export const CLIENT_HEADER = `axentra-studio/${STUDIO_VERSION}; api=${REQUIRED_API.major}.${REQUIRED_API.minor}`;

/**
 * Endpoints where a 401 is an expected answer (probing the session, wrong credentials) and
 * must not trigger the global "session expired" redirect.
 */
const EXPECTED_401_PATHS = new Set([
  '/v1/auth/session',
  '/v1/auth/login/password',
  '/v1/auth/setup',
  '/v1/auth/logout',
]);

type UnauthenticatedListener = () => void;
const unauthenticatedListeners = new Set<UnauthenticatedListener>();

/** Subscribe to "a protected request returned 401". Returns an unsubscribe function. */
export function onUnauthenticated(listener: UnauthenticatedListener): () => void {
  unauthenticatedListeners.add(listener);
  return () => unauthenticatedListeners.delete(listener);
}

/** For requests outside openapi-fetch (XHR file uploads): report a 401 the same way. */
export function reportUnauthenticated(): void {
  unauthenticatedListeners.forEach((listener) => listener());
}

const axentraMiddleware: Middleware = {
  onRequest({ request }) {
    const token = getCsrfToken();
    if (token && needsCsrf(request.method)) {
      request.headers.set(CSRF_HEADER, token);
    }
    return request;
  },
  onResponse({ response, schemaPath }) {
    if (response.status === 401 && !EXPECTED_401_PATHS.has(schemaPath)) {
      unauthenticatedListeners.forEach((listener) => listener());
    }
    return response;
  },
};

export interface ClientOptions {
  baseUrl: string;
  fetch?: (input: Request) => Promise<Response>;
}

export function createAxentraClient({ baseUrl, fetch }: ClientOptions): AxentraClient {
  const client = createClient<paths>({
    baseUrl,
    credentials: 'include',
    headers: { Accept: 'application/json', 'Axentra-Client': CLIENT_HEADER },
    ...(fetch ? { fetch } : {}),
  });
  client.use(axentraMiddleware);
  return client;
}

let currentClient: AxentraClient = createAxentraClient({ baseUrl: '' });
let currentBaseUrl = '';

/** Point the shared client at another API origin (from `/config.json`). */
export function configureApi(options: ClientOptions): void {
  currentBaseUrl = options.baseUrl;
  currentClient = createAxentraClient(options);
}

export function api(): AxentraClient {
  return currentClient;
}

/** Absolute or same-origin URL for browser navigations (OIDC start links). */
export function apiUrl(path: string): string {
  return `${currentBaseUrl}${path}`;
}

export function isSameOriginApi(): boolean {
  return currentBaseUrl === '';
}

interface FetchResult {
  data?: unknown;
  error?: unknown;
  response: Response;
}

/**
 * Await an openapi-fetch call and return its data, throwing `ApiError` for problem responses
 * and network failures. All endpoint functions go through this.
 */
export async function unwrap<T>(promise: Promise<FetchResult>): Promise<T> {
  let result: FetchResult;
  try {
    result = await promise;
  } catch (error) {
    throw toApiError(error);
  }
  if (result.error !== undefined || (!result.response.ok && result.data === undefined)) {
    throw problemToError(result.error, result.response);
  }
  return result.data as T;
}
