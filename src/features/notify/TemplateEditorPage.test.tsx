import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { TemplateEditorPage } from './TemplateEditorPage';
import {
  PRODUCT,
  builtinTemplate,
  makeMe,
  mockApi,
  renderInProduct,
  template,
} from './notify-test-utils';

const base = `/v1/products/${PRODUCT}/notify/templates`;
const NEW_PATH = '/p/:productId/notifications/templates/new';
const EDIT_PATH = '/p/:productId/notifications/templates/:templateKey';

afterEach(() => configureApi({ baseUrl: '' }));

type User = ReturnType<typeof userEvent.setup>;

/** Paste instead of typing: fast, and `{{` needs no escaping. */
async function fill(user: User, element: HTMLElement, text: string) {
  await user.click(element);
  await user.paste(text);
}

async function rendered(request: Request) {
  const body = (await request.json()) as {
    sample_data: Record<string, string>;
    variants: Record<string, { subject: string; text: string; html: string | null }>;
    locale: string;
  };
  const variant = body.variants[body.locale] ?? body.variants.en;
  const fill = (value: string) =>
    value.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => body.sample_data[name] ?? '');
  return jsonResponse({
    locale: body.locale,
    subject: fill(variant?.subject ?? ''),
    text: fill(variant?.text ?? ''),
    html: variant?.html ? fill(variant.html) : null,
  });
}

describe('TemplateEditorPage', () => {
  it('creates a template with a live server preview in a sandboxed frame', async () => {
    const me = makeMe(['notify:manage']);
    const calls = mockApi(me, async (request, url) => {
      if (url.pathname === `${base}/preview`) return rendered(request);
      if (url.pathname === base && request.method === 'POST') {
        return jsonResponse({ ...template, key: 'welcome', version: 1 }, { status: 201 });
      }
      return undefined;
    });
    renderInProduct(
      <TemplateEditorPage />,
      me,
      `/p/${PRODUCT}/notifications/templates/new`,
      NEW_PATH,
    );
    const user = userEvent.setup();
    await fill(user, await screen.findByRole('textbox', { name: /^Template key/ }), 'welcome');
    await fill(user, screen.getByRole('textbox', { name: /^Subject/ }), 'Welcome {{ name }}');
    await fill(user, screen.getByRole('textbox', { name: /^Text/ }), 'Hi {{ name }}');
    await fill(
      user,
      screen.getByRole('textbox', { name: 'HTML' }),
      '<p>Hi {{ name }}</p><script>alert(1)</script>',
    );
    await user.click(screen.getByRole('button', { name: 'Declare used placeholders: name' }));
    await fill(user, screen.getByRole('textbox', { name: 'Sample value' }), 'Ada');

    expect(await screen.findByText('Welcome Ada', {}, { timeout: 3000 })).toBeInTheDocument();
    const frame = screen.getByTitle('HTML preview of the template');
    expect(frame).toHaveAttribute('sandbox', '');
    expect(frame.getAttribute('srcdoc')).toContain('<p>Hi Ada</p>');

    await user.click(screen.getByRole('button', { name: 'Create template' }));
    await waitFor(() =>
      expect(calls.some((call) => call.method === 'POST' && call.url.endsWith(base))).toBe(true),
    );
    const post = calls.find((call) => call.method === 'POST' && call.url.endsWith(base)) as Request;
    const body = (await post.json()) as Record<string, unknown>;
    expect(body).toMatchObject({
      key: 'welcome',
      channel: 'email',
      variables: ['name'],
      sample_data: { name: 'Ada' },
      variants: { en: { subject: 'Welcome {{ name }}', text: 'Hi {{ name }}' } },
    });
  });

  it('saves a new version with If-Match and shows preview validation errors', async () => {
    const me = makeMe(['notify:manage']);
    const calls = mockApi(me, async (request, url) => {
      if (url.pathname === `${base}/preview`) {
        const body = (await request.json()) as { variants: { en: { subject: string } } };
        if (body.variants.en.subject.includes('{{ missing }}')) {
          return jsonResponse(
            { code: 'validation_failed', status: 422, detail: 'undeclared variable: missing' },
            { status: 422 },
          );
        }
        return jsonResponse({ locale: 'en', subject: 'Welcome Ada', text: 'Hi Ada', html: null });
      }
      if (url.pathname === `${base}/welcome` && request.method === 'GET')
        return jsonResponse(template);
      if (url.pathname === `${base}/welcome` && request.method === 'PATCH')
        return jsonResponse({ ...template, version: 4 });
      return undefined;
    });
    renderInProduct(
      <TemplateEditorPage />,
      me,
      `/p/${PRODUCT}/notifications/templates/welcome`,
      EDIT_PATH,
    );
    const user = userEvent.setup();
    expect(await screen.findByText('Version 3')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'de' })).toBeInTheDocument();

    const subject = screen.getByRole('textbox', { name: /^Subject/ });
    await fill(user, subject, ' {{ missing }}');
    expect(
      await screen.findByText('undeclared variable: missing', {}, { timeout: 3000 }),
    ).toBeInTheDocument();
    await user.clear(subject);
    await fill(user, subject, 'Hello {{ name }}');

    await user.click(screen.getByRole('button', { name: 'Save new version' }));
    await waitFor(() => expect(calls.some((call) => call.method === 'PATCH')).toBe(true));
    const patch = calls.find((call) => call.method === 'PATCH') as Request;
    expect(patch.headers.get('If-Match')).toBe('3');
    const body = (await patch.json()) as { variants: Record<string, { subject: string }> };
    expect(body.variants.en?.subject).toBe('Hello {{ name }}');
    expect(Object.keys(body.variants).sort()).toEqual(['de', 'en']);
    expect(await screen.findByText(/saved \(version 4\)/)).toBeInTheDocument();
  });

  it('saves an edited built-in default as an override (create with the same key)', async () => {
    const me = makeMe(['notify:manage']);
    const calls = mockApi(me, (request, url) => {
      if (url.pathname === `${base}/preview`)
        return jsonResponse({ locale: 'en', subject: 'x', text: 'y', html: null });
      if (url.pathname === `${base}/invitation`) return jsonResponse(builtinTemplate);
      if (url.pathname === base && request.method === 'POST')
        return jsonResponse({ ...builtinTemplate, id: 'tpl_9', builtin: false, version: 1 });
      return undefined;
    });
    renderInProduct(
      <TemplateEditorPage />,
      me,
      `/p/${PRODUCT}/notifications/templates/invitation`,
      EDIT_PATH,
    );
    const user = userEvent.setup();
    expect(await screen.findByText(/This is a built-in default/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete template' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save own version' }));
    await waitFor(() =>
      expect(calls.some((call) => call.method === 'POST' && call.url.endsWith(base))).toBe(true),
    );
    const post = calls.find((call) => call.method === 'POST' && call.url.endsWith(base)) as Request;
    expect(((await post.json()) as { key: string }).key).toBe('invitation');
  });

  it('refuses editing without notify:manage', async () => {
    const me = makeMe([]);
    mockApi(me, () => undefined);
    renderInProduct(
      <TemplateEditorPage />,
      me,
      `/p/${PRODUCT}/notifications/templates/new`,
      NEW_PATH,
    );
    expect(await screen.findByText(/You need the permission notify:manage/)).toBeInTheDocument();
  });
});
