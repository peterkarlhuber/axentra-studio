import { useMutation } from '@tanstack/react-query';
import { apiUrl } from '@/api/client';
import { filesApi } from '@/api/endpoints';
import type { DownloadUrl, FileInfo } from '@/api/models';
import { useErrorToast } from '@/app/auth';

/**
 * Where the browser should fetch a download URL. Signed Axentra URLs are opened through the
 * API origin Studio is configured for (same origin behind the proxy), because the absolute
 * `url` is built from the server's `public_url`, which may not be reachable from here.
 * Presigned S3 URLs are used as given.
 */
export function downloadHref(link: DownloadUrl): string {
  return link.kind === 'signed' && link.path ? apiUrl(link.path) : link.url;
}

/** Start a browser download (the server always answers with `Content-Disposition: attachment`). */
export function startDownload(href: string): void {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

/** Download a file through a short-lived signed URL (`POST .../download-url`). */
export function useFileDownload(productId: string, tenantId: string) {
  const showError = useErrorToast();
  return useMutation({
    mutationFn: (file: FileInfo) => filesApi.downloadUrl(productId, tenantId, file.id),
    onSuccess: (link) => startDownload(downloadHref(link)),
    onError: showError,
  });
}
