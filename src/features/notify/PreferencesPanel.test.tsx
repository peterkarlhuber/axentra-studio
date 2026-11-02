import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { jsonResponse } from '@/test/utils';
import { PreferencesPanel } from './PreferencesPanel';
import { PRODUCT, makeMe, mockApi, renderInProduct } from './notify-test-utils';

afterEach(() => configureApi({ baseUrl: '' }));

const prefs = {
  product_id: PRODUCT,
  tenant_id: null,
  user_id: 'usr_me',
  opted_out: ['marketing'],
  available_categories: ['onboarding', 'marketing'],
  locked_categories: ['transactional', 'security'],
  version: 4,
};

describe('PreferencesPanel', () => {
  it('locks transactional/security and saves opt-outs with If-Match', async () => {
    const me = makeMe([]);
    const calls = mockApi(me, async (request, url) => {
      if (url.pathname === `/v1/products/${PRODUCT}/notify/preferences/me`) {
        if (request.method === 'PUT') {
          const body = (await request.json()) as { opted_out: string[] };
          return jsonResponse({ ...prefs, opted_out: body.opted_out, version: 5 });
        }
        return jsonResponse(prefs);
      }
      if (url.pathname === `/v1/products/${PRODUCT}/tenants`) return jsonResponse({ items: [] });
      return undefined;
    });
    renderInProduct(<PreferencesPanel productId={PRODUCT} />, me);
    const user = userEvent.setup();

    expect(await screen.findByRole('checkbox', { name: /transactional/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /security/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'marketing' })).not.toBeChecked();
    const save = screen.getByRole('button', { name: 'Save preferences' });
    expect(save).toBeDisabled();

    await user.click(screen.getByRole('checkbox', { name: 'onboarding' }));
    await user.click(save);
    await waitFor(() => expect(calls.some((call) => call.method === 'PUT')).toBe(true));
    const put = calls.find((call) => call.method === 'PUT') as Request;
    expect(put.headers.get('If-Match')).toBe('4');
    expect(await put.json()).toEqual({ opted_out: ['marketing', 'onboarding'] });
    expect(await screen.findByText('Preferences saved.')).toBeInTheDocument();
  });
});
