/**
 * Multipart file upload (`POST .../files`) through XMLHttpRequest, because `fetch` cannot
 * report upload progress. Sends the same headers as the typed client (credentials, CSRF,
 * `Axentra-Client`) and turns problem responses into `ApiError`.
 */
import { apiUrl, CLIENT_HEADER, reportUnauthenticated } from './client';
import { CSRF_HEADER, getCsrfToken } from './csrf';
import { ApiError, problemToError } from './errors';
import type { FileInfo } from './models';

export interface UploadInput {
  file: File;
  /** Display name; the server falls back to the file name. */
  name?: string;
  metadata?: Record<string, unknown>;
  /** RFC 3339 timestamp. */
  expiresAt?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

function parseBody(text: string): unknown {
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function uploadFile(
  productId: string,
  tenantId: string,
  input: UploadInput,
  options: UploadOptions = {},
): Promise<FileInfo> {
  const path = `/v1/products/${encodeURIComponent(productId)}/tenants/${encodeURIComponent(
    tenantId,
  )}/files`;
  const form = new FormData();
  // Fields before the file part, so the server sees them without buffering the file.
  if (input.name) form.append('name', input.name);
  if (input.metadata && Object.keys(input.metadata).length > 0) {
    form.append('metadata', JSON.stringify(input.metadata));
  }
  if (input.expiresAt) form.append('expires_at', input.expiresAt);
  form.append('file', input.file, input.file.name);

  return new Promise<FileInfo>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', apiUrl(path));
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Axentra-Client', CLIENT_HEADER);
    const token = getCsrfToken();
    if (token) xhr.setRequestHeader(CSRF_HEADER, token);

    const abort = () => xhr.abort();
    options.signal?.addEventListener('abort', abort, { once: true });
    const done = () => options.signal?.removeEventListener('abort', abort);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        options.onProgress?.({ loaded: event.loaded, total: event.total });
      }
    };
    xhr.onload = () => {
      done();
      const body = parseBody(xhr.responseText);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as FileInfo);
        return;
      }
      if (xhr.status === 401) reportUnauthenticated();
      const headers = new Headers();
      const requestId = xhr.getResponseHeader('X-Request-ID');
      if (requestId) headers.set('X-Request-ID', requestId);
      reject(problemToError(body, new Response(null, { status: xhr.status, headers })));
    };
    xhr.onerror = () => {
      done();
      reject(new ApiError({ status: 0, code: 'network_error' }));
    };
    xhr.onabort = () => {
      done();
      reject(new ApiError({ status: 0, code: 'aborted', detail: 'aborted' }));
    };
    xhr.send(form);
  });
}
