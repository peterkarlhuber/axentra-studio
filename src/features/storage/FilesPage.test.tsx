import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { configureApi } from '@/api/client';
import { setCsrfToken } from '@/api/csrf';
import { jsonResponse } from '@/test/utils';
import { FilesPage } from './FilesPage';
import {
  fileInfo,
  installFakeXhr,
  meWith,
  mockApi,
  renderPage,
  TENANT_ID,
  usage,
  type Handler,
} from './storage-test-utils';

const FILES = `/v1/products/prd_1/tenants/${TENANT_ID}/files`;
const route = `/p/prd_1/files?tenant=${TENANT_ID}`;

afterEach(() => {
  configureApi({ baseUrl: '' });
  setCsrfToken(null);
  vi.unstubAllGlobals();
});

/** Files list with one file, the tenant's usage, and whatever `extra` answers. */
function api(extra: Handler = () => undefined, files = [fileInfo()]) {
  return mockApi(async (request, url) => {
    const answer = await extra(request, url);
    if (answer) return answer;
    if (url.pathname === FILES && request.method === 'GET') {
      return jsonResponse({ items: files, next_cursor: null });
    }
    if (url.pathname.endsWith('/storage/usage')) return jsonResponse(usage);
    return undefined;
  });
}

describe('FilesPage', () => {
  it('asks for a tenant before showing files', async () => {
    api();
    renderPage(<FilesPage />, { me: meWith(['files:read']), route: '/p/prd_1/files' });
    expect(await screen.findByRole('heading', { name: 'Choose a tenant' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload file' })).not.toBeInTheDocument();
  });

  it('explains missing files:read instead of listing', async () => {
    const calls = api();
    renderPage(<FilesPage />, { me: meWith([], ['records:read']), route });
    expect(
      await screen.findByRole('heading', { name: /No access to this tenant's files/ }),
    ).toBeInTheDocument();
    expect(calls.some((call) => new URL(call.url).pathname === FILES)).toBe(false);
  });

  it('lists files with usage and sends filters to the API (read-only principal)', async () => {
    const calls = api();
    renderPage(<FilesPage />, { me: meWith([], ['files:read']), route });
    const table = await screen.findByRole('table', { name: 'Files of the selected tenant' });
    expect(await within(table).findByRole('button', { name: 'report.pdf' })).toBeInTheDocument();
    expect(within(table).getByText('2 KiB')).toBeInTheDocument();
    expect(await screen.findByText('2 KiB of 1 GiB')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Upload file' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit quota' })).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Content type'), 'image/*');
    await user.type(screen.getByLabelText('Label'), 'kind');
    await user.type(screen.getByLabelText('Equals'), 'invoice');
    await user.click(screen.getByRole('button', { name: 'Add label filter' }));
    await waitFor(() => {
      const last = calls.filter((call) => new URL(call.url).pathname === FILES).pop();
      const params = new URL(last?.url ?? 'http://x').searchParams;
      expect(params.get('content_type')).toBe('image/*');
      expect(params.get('metadata')).toBe('{"kind":"invoice"}');
      expect(params.get('sort')).toBe('-created_at');
    });
  });

  it('uploads with progress, CSRF header and form fields, then refreshes the list', async () => {
    const calls = api();
    const sent = installFakeXhr(() => ({
      status: 201,
      body: fileInfo({ id: 'fil_2', name: 'notes.txt' }),
    }));
    renderPage(<FilesPage />, { me: meWith([], ['files:read', 'files:write']), route });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Upload file' }));
    const dialog = await screen.findByRole('dialog', { name: 'Upload file' });
    expect(within(dialog).getByText(/The allowed types are visible/)).toBeInTheDocument();
    const file = new File(['hello world'], 'notes.txt', { type: 'text/plain' });
    await user.upload(within(dialog).getByLabelText(/^File/), file);
    await user.type(within(dialog).getByLabelText('Labels (metadata)'), '{{"kind":"note"}');
    const listCalls = calls.filter((call) => new URL(call.url).pathname === FILES).length;
    await user.click(within(dialog).getByRole('button', { name: 'Upload' }));

    expect(
      await screen.findByText('notes.txt uploaded', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(sent).toHaveLength(1);
    const [upload] = sent;
    expect(upload?.method).toBe('POST');
    expect(upload?.url).toBe(`http://axentra.test${FILES}`);
    expect(upload?.withCredentials).toBe(true);
    expect(upload?.headers['X-Axentra-CSRF']).toBe('csrf-1');
    expect((upload?.body.get('file') as File).name).toBe('notes.txt');
    expect(upload?.body.get('metadata')).toBe('{"kind":"note"}');
    await waitFor(() =>
      expect(calls.filter((call) => new URL(call.url).pathname === FILES).length).toBeGreaterThan(
        listCalls,
      ),
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Upload file' })).not.toBeInTheDocument(),
    );
  });

  it('explains a blocked file type with the server message and request id', async () => {
    api();
    installFakeXhr(() => ({
      status: 415,
      body: {
        code: 'unsupported_media_type',
        status: 415,
        detail: 'executable, HTML, SVG and script files are not accepted',
        request_id: 'req-415',
      },
    }));
    renderPage(<FilesPage />, { me: meWith([], ['files:read', 'files:write']), route });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Upload file' }));
    const dialog = await screen.findByRole('dialog', { name: 'Upload file' });
    await user.upload(
      within(dialog).getByLabelText(/^File/),
      new File(['<html></html>'], 'page.html', { type: 'text/html' }),
    );
    await user.click(within(dialog).getByRole('button', { name: 'Upload' }));
    const alert = await within(dialog).findByRole('alert');
    expect(alert).toHaveTextContent('File type not accepted');
    expect(alert).toHaveTextContent('executable, HTML, SVG and script files are not accepted');
    expect(alert).toHaveTextContent('req-415');
    expect(screen.getByRole('dialog', { name: 'Upload file' })).toBeInTheDocument();
  });

  it('refuses files above the server limit before sending (limits from settings)', async () => {
    api((_request, url) =>
      url.pathname === '/v1/settings'
        ? jsonResponse({
            storage: {
              backend: 'local',
              max_file_bytes: 1000,
              allowed_content_types: ['image/*'],
              store_blocked_as_inert: false,
            },
          })
        : undefined,
    );
    const sent = installFakeXhr(() => ({ status: 201, body: fileInfo() }));
    renderPage(<FilesPage />, {
      me: meWith(['product:manage'], ['files:read', 'files:write']),
      route,
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Upload file' }));
    const dialog = await screen.findByRole('dialog', { name: 'Upload file' });
    expect(await within(dialog).findByText('At most 1,000 B per file.')).toBeInTheDocument();
    expect(within(dialog).getByText('Allowed types: image/*.')).toBeInTheDocument();
    await user.upload(
      within(dialog).getByLabelText(/^File/),
      new File(['x'.repeat(2000)], 'big.txt', { type: 'text/plain' }),
    );
    expect(
      within(dialog).getByText(/This file is larger than the server's limit of 1,000 B/),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/not on the server's allow-list/)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Upload' })).toBeDisabled();
    expect(sent).toHaveLength(0);
  });

  it('downloads through a signed URL on the configured API origin', async () => {
    const calls = api((_request, url) =>
      url.pathname === `${FILES}/fil_1/download-url`
        ? jsonResponse({
            url: 'https://public.example/v1/files/download/d1.tok',
            path: '/v1/files/download/d1.tok',
            expires_at: '2026-11-01T12:05:00Z',
            kind: 'signed',
          })
        : undefined,
    );
    const clicked: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.href);
    });
    renderPage(<FilesPage />, { me: meWith([], ['files:read']), route });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Actions for report.pdf' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Download' }));
    await waitFor(() => expect(clicked).toEqual(['http://axentra.test/v1/files/download/d1.tok']));
    const post = calls.find((call) => call.url.endsWith('/download-url'));
    expect(post?.method).toBe('POST');
  });

  it('deletes a file after confirmation with If-Match', async () => {
    const calls = api((request) =>
      request.method === 'DELETE' ? new Response(null, { status: 204 }) : undefined,
    );
    renderPage(<FilesPage />, { me: meWith([], ['files:read', 'files:write']), route });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Actions for report.pdf' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete file' }));
    const dialog = await screen.findByRole('dialog', { name: 'Delete file?' });
    expect(dialog).toHaveTextContent('report.pdf is removed for everyone');
    await user.click(within(dialog).getByRole('button', { name: 'Delete file' }));
    expect(await screen.findByText('report.pdf deleted')).toBeInTheDocument();
    const del = calls.find((call) => call.method === 'DELETE');
    expect(new URL(del?.url ?? 'http://x').pathname).toBe(`${FILES}/fil_1`);
    expect(del?.headers.get('If-Match')).toBe('3');
    expect(del?.headers.get('X-Axentra-CSRF')).toBe('csrf-1');
  });

  it('shows details, creates a share link and edits labels with If-Match', async () => {
    const calls = api(async (request, url) => {
      if (url.pathname === `${FILES}/fil_1` && request.method === 'GET') {
        return jsonResponse(fileInfo());
      }
      if (url.pathname === `${FILES}/fil_1` && request.method === 'PATCH') {
        const body = (await request.json()) as { metadata: Record<string, unknown> };
        return jsonResponse(fileInfo({ metadata: body.metadata, version: 4 }));
      }
      if (url.pathname === `${FILES}/fil_1/download-url`) {
        return jsonResponse({
          url: 'https://public.example/v1/files/download/d1.share',
          path: '/v1/files/download/d1.share',
          expires_at: '2026-11-01T12:05:00Z',
          kind: 'signed',
        });
      }
      return undefined;
    });
    renderPage(<FilesPage />, {
      me: meWith([], ['files:read', 'files:write']),
      route: `${route}&file=fil_1`,
    });
    const drawer = await screen.findByRole('dialog', { name: 'report.pdf' });
    expect(await within(drawer).findByText('ab'.repeat(32))).toBeInTheDocument();
    expect(within(drawer).getByText('application/pdf')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(within(drawer).getByRole('button', { name: 'Create download link' }));
    expect(
      await within(drawer).findByDisplayValue('https://public.example/v1/files/download/d1.share'),
    ).toBeInTheDocument();

    await user.click(within(drawer).getByRole('button', { name: 'Edit name and labels' }));
    const form = within(drawer).getByRole('form', { name: 'Edit file' });
    const labels = within(form).getByLabelText('Labels (metadata)');
    await user.clear(labels);
    await user.type(labels, '{{"kind":"receipt"}');
    await user.click(within(form).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('File updated')).toBeInTheDocument();
    const patch = calls.find((call) => call.method === 'PATCH');
    expect(patch?.headers.get('If-Match')).toBe('3');
    expect(await patch?.json()).toEqual({ metadata: { kind: 'receipt' } });
  });

  it('edits the tenant quota with the quota version as If-Match', async () => {
    const calls = api((request) =>
      request.method === 'PUT'
        ? jsonResponse({
            ...usage,
            quota_bytes: 2 * 1024 ** 3,
            quota_bytes_override: 2 * 1024 ** 3,
          })
        : undefined,
    );
    renderPage(<FilesPage />, {
      me: meWith(['tenants:update'], ['files:read']),
      route,
    });
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Edit quota' }));
    const dialog = await screen.findByRole('dialog', { name: 'Storage quota' });
    await user.type(within(dialog).getByLabelText('Storage limit'), '2');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Storage quota saved')).toBeInTheDocument();
    const put = calls.find((call) => call.method === 'PUT');
    expect(put?.headers.get('If-Match')).toBe('0');
    expect(await put?.json()).toEqual({ quota_bytes: 2 * 1024 ** 3, quota_files: null });
  });
});
