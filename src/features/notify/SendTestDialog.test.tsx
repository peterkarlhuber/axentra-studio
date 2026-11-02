import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { SendTestDialog } from './SendTestDialog';
import {
  PRODUCT,
  TENANT,
  makeMe,
  makeMessage,
  mockApi,
  renderInProduct,
  template,
} from './notify-test-utils';

afterEach(() => configureApi({ baseUrl: '' }));

describe('SendTestDialog', () => {
  it('sends to a tenant member with an Idempotency-Key and previews the stored template', async () => {
    const me = makeMe(['notify:manage', 'notify:send']);
    const calls = mockApi(me, (request, url) => {
      if (url.pathname === `/v1/products/${PRODUCT}/tenants`)
        return jsonResponse({ items: [{ id: TENANT, name: 'Acme' }] });
      if (url.pathname === `/v1/products/${PRODUCT}/tenants/${TENANT}/members`)
        return jsonResponse([
          { user_id: 'usr_ada', email: 'ada@example.com', name: 'Ada', role: 'member' },
        ]);
      if (url.pathname === `/v1/products/${PRODUCT}/notify/templates/welcome/preview`)
        return jsonResponse({ locale: 'en', subject: 'Welcome Grace', text: 'Hi', html: null });
      if (url.pathname === `/v1/products/${PRODUCT}/tenants/${TENANT}/notify/send`)
        return jsonResponse(makeMessage({ status: 'queued', id: 'msg_9' }), { status: 202 });
      void request;
      return undefined;
    });
    renderInProduct(
      <SendTestDialog productId={PRODUCT} template={template} onClose={() => undefined} />,
      me,
    );
    const user = userEvent.setup();
    const tenant = await screen.findByRole('combobox', { name: /Tenant/ });
    await screen.findByRole('option', { name: 'Acme' });
    await user.selectOptions(tenant, TENANT);
    await screen.findByRole('option', { name: 'Ada <ada@example.com>' });
    await user.selectOptions(screen.getByRole('combobox', { name: /^Member/ }), 'usr_ada');
    const value = screen.getByDisplayValue('Ada');
    await user.clear(value);
    await user.type(value, 'Grace');

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByText('Welcome Grace')).toBeInTheDocument();
    const preview = calls.find((call) => call.url.endsWith('/preview')) as Request;
    expect(await preview.json()).toEqual({ locale: null, variables: { name: 'Grace' } });

    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('msg_9')).toBeInTheDocument();
    const send = calls.find((call) => call.url.endsWith('/notify/send')) as Request;
    expect(send.headers.get('Idempotency-Key')).toMatch(/^studio-/);
    expect(await send.json()).toEqual({
      template_key: 'welcome',
      to: { user_id: 'usr_ada' },
      variables: { name: 'Grace' },
      locale: null,
    });
  });

  it('sends to an email address with notify:send_external', async () => {
    const me = makeMe(['notify:send', 'notify:send_external']);
    const calls = mockApi(me, (_request, url) => {
      if (url.pathname === `/v1/products/${PRODUCT}/tenants`)
        return jsonResponse({ items: [{ id: TENANT, name: 'Acme' }] });
      if (url.pathname.endsWith('/notify/send'))
        return jsonResponse(makeMessage({ status: 'queued' }));
      return undefined;
    });
    renderInProduct(
      <SendTestDialog productId={PRODUCT} template={template} onClose={() => undefined} />,
      me,
    );
    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Acme' });
    await user.selectOptions(screen.getByRole('combobox', { name: /Tenant/ }), TENANT);
    await user.selectOptions(screen.getByRole('combobox', { name: 'Send to' }), 'email');
    await user.type(screen.getByRole('textbox', { name: /^Email address/ }), 'x@example.com');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'de');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(calls.some((call) => call.url.endsWith('/notify/send'))).toBe(true));
    const send = calls.find((call) => call.url.endsWith('/notify/send')) as Request;
    expect(await send.json()).toMatchObject({ to: { email: 'x@example.com' }, locale: 'de' });
  });

  it('offers members only without notify:send_external and explains why', async () => {
    const me = makeMe(['notify:send']);
    mockApi(me, (_request, url) => {
      if (url.pathname === `/v1/products/${PRODUCT}/tenants`)
        return jsonResponse({ items: [{ id: TENANT, name: 'Acme' }] });
      if (url.pathname === `/v1/products/${PRODUCT}/tenants/${TENANT}/members`)
        return jsonResponse([]);
      return undefined;
    });
    renderInProduct(
      <SendTestDialog productId={PRODUCT} template={template} onClose={() => undefined} />,
      me,
    );
    await screen.findByRole('option', { name: 'Acme' });
    expect(screen.queryByRole('combobox', { name: 'Send to' })).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: /^Email address/ })).not.toBeInTheDocument();
    expect(
      screen.getByText(/needs the product permission notify:send_external/),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /^Member/ })).toBeInTheDocument();
  });

  it('renews the Idempotency-Key after a 409 and explains the conflict', async () => {
    const me = makeMe(['notify:send']);
    let attempt = 0;
    const calls = mockApi(me, (_request, url) => {
      if (url.pathname === `/v1/products/${PRODUCT}/tenants`)
        return jsonResponse({ items: [{ id: TENANT, name: 'Acme' }] });
      if (url.pathname === `/v1/products/${PRODUCT}/tenants/${TENANT}/members`)
        return jsonResponse([
          { user_id: 'usr_ada', email: 'ada@example.com', name: 'Ada', role: 'member' },
        ]);
      if (url.pathname.endsWith('/notify/send')) {
        attempt += 1;
        return attempt === 1
          ? jsonResponse(
              {
                code: 'conflict',
                status: 409,
                title: 'Conflict',
                detail: 'the Idempotency-Key was already used for a different request',
              },
              { status: 409 },
            )
          : jsonResponse(makeMessage({ status: 'queued', id: 'msg_2' }), { status: 202 });
      }
      return undefined;
    });
    renderInProduct(
      <SendTestDialog productId={PRODUCT} template={template} onClose={() => undefined} />,
      me,
    );
    const user = userEvent.setup();
    await screen.findByRole('option', { name: 'Acme' });
    await user.selectOptions(screen.getByRole('combobox', { name: /Tenant/ }), TENANT);
    await screen.findByRole('option', { name: 'Ada <ada@example.com>' });
    await user.selectOptions(screen.getByRole('combobox', { name: /^Member/ }), 'usr_ada');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('Already used for a different request')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByText('msg_2')).toBeInTheDocument();
    const sends = calls.filter((call) => call.url.endsWith('/notify/send'));
    expect(sends).toHaveLength(2);
    expect(sends[0]?.headers.get('Idempotency-Key')).not.toBe(
      sends[1]?.headers.get('Idempotency-Key'),
    );
  });
});
