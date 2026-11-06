import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { configureApi } from '@/api/client';
import { tenantsApi, productsApi } from '@/api/endpoints';
import type { Me, Role } from '@/api/models';
import { jsonResponse, renderWithProviders } from '@/test/utils';
import { InvitationsPanel } from '@/features/tenants/InvitationsPanel';
import { MembersPanel } from './MembersPanel';

const PRODUCT = 'prd_1';
const TENANT = 'ten_1';
const TENANT_PERMS = [
  'tenant:read',
  'members:read',
  'members:manage',
  'records:read',
  'records:write',
  'files:read',
  'files:write',
  'notify:send',
];
const VIEWER = ['tenant:read', 'members:read', 'records:read', 'files:read'];

const role = (key: string, name: string, permissions: string[], scope = 'tenant'): Role =>
  ({ key, name, permissions, scope, builtin: true, description: '', id: null, version: 1 }) as Role;

const PRODUCT_PERMS = [
  'product:read',
  'product_members:read',
  'product_members:manage',
  'tenants:read',
];

const productRoles = [
  role('product_owner', 'Product owner', PRODUCT_PERMS, 'product'),
  role('product_admin', 'Product admin', ['product:read', 'tenants:read'], 'product'),
  role('product_viewer', 'Product viewer', ['product:read'], 'product'),
];

const productInvitationCreated = (email: string) => ({
  invitation: {
    id: 'pinv_new',
    product_id: PRODUCT,
    email,
    role: 'product_viewer',
    status: 'pending',
    invited_by: 'usr_me',
    created_at: '2026-11-06T00:00:00Z',
    expires_at: '2026-11-13T00:00:00Z',
    accepted_at: null,
    revoked_at: null,
  },
  token: 'axpinv_secret',
  accept_url: null,
});

const tenantRoles = [
  role('tenant_owner', 'Owner', TENANT_PERMS),
  role('tenant_admin', 'Admin', TENANT_PERMS),
  role('member', 'Member', ['tenant:read', 'members:read', 'records:read', 'records:write']),
  role('viewer', 'Viewer', VIEWER),
];

function makeMe(product: { role: string | null; permissions: string[] }, tenantRole?: string) {
  return {
    user: { id: 'usr_me', email: 'me@example.com', name: 'Me' },
    actor_kind: 'user',
    platform_role: null,
    platform_permissions: [],
    products: [
      {
        product: { id: PRODUCT, name: 'Prod', slug: 'prod' },
        role: product.role,
        permissions: product.permissions,
        tenants: tenantRole
          ? [{ tenant: { id: TENANT, name: 'Acme' }, role: tenantRole, permissions: TENANT_PERMS }]
          : [],
      },
    ],
  } as unknown as Me;
}

type Handler = (request: Request, url: URL) => Response | undefined;

function mockApi(me: Me, handler: Handler, roles: Role[] = tenantRoles) {
  const calls: Request[] = [];
  configureApi({
    baseUrl: 'http://axentra.test',
    fetch: async (request: Request) => {
      calls.push(request.clone());
      const url = new URL(request.url);
      if (url.pathname === '/v1/auth/session') return jsonResponse({ csrf_token: 'csrf' });
      if (url.pathname === '/v1/me') return jsonResponse(me);
      if (url.pathname === `/v1/products/${PRODUCT}/roles`) return jsonResponse(roles);
      return (
        handler(request, url) ?? jsonResponse({ code: 'not_found', status: 404 }, { status: 404 })
      );
    },
  });
  return calls;
}

const members = [
  { user_id: 'usr_a', email: 'admin@example.com', name: 'Ada Admin', role: 'tenant_admin' },
  { user_id: 'usr_v', email: 'viewer@example.com', name: 'Vic Viewer', role: 'viewer' },
];
const membersPath = `/v1/products/${PRODUCT}/tenants/${TENANT}/members`;

function renderTenantPanel(withInvite = true) {
  return renderWithProviders(
    <MembersPanel
      productId={PRODUCT}
      scope="tenant"
      tenantId={TENANT}
      caption="Members"
      queryKey={['test', 'members']}
      list={() => tenantsApi.members(PRODUCT, TENANT)}
      add={(body) => tenantsApi.addMember(PRODUCT, TENANT, body)}
      updateRole={(userId, next) => tenantsApi.updateMember(PRODUCT, TENANT, userId, next)}
      remove={(userId) => tenantsApi.removeMember(PRODUCT, TENANT, userId)}
      invite={withInvite ? (body) => tenantsApi.invite(PRODUCT, TENANT, body) : undefined}
      canManage
    />,
  );
}

afterEach(() => configureApi({ baseUrl: '' }));

describe('MembersPanel role ceiling', () => {
  it('offers only roles within the caller’s grant (product support: viewers only)', async () => {
    // product_support: reads plus members:manage, no tenant role.
    const me = makeMe({ role: 'product_support', permissions: [...VIEWER, 'members:manage'] });
    mockApi(me, (_request, url) =>
      url.pathname === membersPath ? jsonResponse(members) : undefined,
    );
    renderTenantPanel();
    const user = userEvent.setup();

    // The admin member is above the caller: no role picker, no remove button.
    const adminRow = (await screen.findByText('Ada Admin')).closest('tr') as HTMLElement;
    expect(await within(adminRow).findByText(/Above your own role/)).toBeInTheDocument();
    expect(within(adminRow).queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Ada Admin' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Vic Viewer' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add member' }));
    const dialog = await screen.findByRole('dialog');
    const select = within(dialog).getByRole('combobox', { name: /Role/ });
    expect(within(select).getByRole('option', { name: /^Owner \(above/ })).toBeDisabled();
    expect(within(select).getByRole('option', { name: /^Admin \(above/ })).toBeDisabled();
    expect(within(select).getByRole('option', { name: /^Member \(above/ })).toBeDisabled();
    expect(within(select).getByRole('option', { name: 'Viewer' })).toBeEnabled();
    expect(within(dialog).getByText(/cannot be assigned/)).toBeInTheDocument();
  });

  it('a tenant admin cannot grant the owner role, a tenant owner can', async () => {
    const admin = makeMe({ role: null, permissions: ['product:read'] }, 'tenant_admin');
    mockApi(admin, (_request, url) =>
      url.pathname === membersPath ? jsonResponse([]) : undefined,
    );
    const { unmount } = renderTenantPanel();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Add member' }));
    let select = within(await screen.findByRole('dialog')).getByRole('combobox', { name: /Role/ });
    await within(select).findByRole('option', { name: /^Owner \(above/ });
    expect(within(select).getByRole('option', { name: 'Admin' })).toBeEnabled();
    unmount();

    const owner = makeMe({ role: null, permissions: ['product:read'] }, 'tenant_owner');
    mockApi(owner, (_request, url) =>
      url.pathname === membersPath ? jsonResponse([]) : undefined,
    );
    renderTenantPanel();
    await user.click(await screen.findByRole('button', { name: 'Add member' }));
    select = within(await screen.findByRole('dialog')).getByRole('combobox', { name: /Role/ });
    expect(await within(select).findByRole('option', { name: 'Owner' })).toBeEnabled();
  });

  it('shows the server’s 403 detail when a change is refused', async () => {
    const me = makeMe({ role: null, permissions: ['product:read'] }, 'tenant_owner');
    mockApi(me, (request, url) => {
      if (url.pathname === membersPath && request.method === 'GET') return jsonResponse(members);
      if (url.pathname === `${membersPath}/usr_v`)
        return jsonResponse(
          {
            code: 'forbidden',
            status: 403,
            detail: 'only owners can assign the role tenant_owner',
          },
          { status: 403 },
        );
      return undefined;
    });
    renderTenantPanel();
    const user = userEvent.setup();
    const select = await screen.findByRole('combobox', { name: 'Role of Vic Viewer' });
    await within(select).findByRole('option', { name: 'Member' });
    await user.selectOptions(select, 'member');
    expect(
      await screen.findByText(/only owners can assign the role tenant_owner/),
    ).toBeInTheDocument();
  });
});

describe('MembersPanel add → invite instead', () => {
  it('offers an invitation when the server does not resolve the user (404)', async () => {
    const me = makeMe({ role: null, permissions: ['product:read'] }, 'tenant_owner');
    const calls = mockApi(me, (request, url) => {
      if (url.pathname === membersPath && request.method === 'GET') return jsonResponse([]);
      if (url.pathname === membersPath && request.method === 'POST')
        return jsonResponse(
          {
            code: 'not_found',
            status: 404,
            detail: 'user not found; invite them by email instead',
          },
          { status: 404 },
        );
      if (url.pathname === `/v1/products/${PRODUCT}/tenants/${TENANT}/invitations`)
        return jsonResponse(
          {
            invitation: {
              id: 'inv_1',
              email: 'new@example.com',
              role: 'viewer',
              status: 'pending',
            },
            token: 'tok_secret',
            accept_url: 'https://studio.test/invitations/accept?token=tok_secret',
          },
          { status: 201 },
        );
      return undefined;
    });
    renderTenantPanel();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Add member' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByRole('textbox', { name: /Email address/ }),
      'new@example.com',
    );
    const select = within(dialog).getByRole('combobox', { name: /Role/ });
    await within(select).findByRole('option', { name: 'Viewer' });
    await user.selectOptions(select, 'viewer');
    await user.click(within(dialog).getByRole('button', { name: 'Add member' }));

    expect(await within(dialog).findByText('User not found')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Send invitation instead' }));
    expect(await screen.findByText('Invitation created')).toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://studio.test/invitations/accept?token=tok_secret'),
    ).toBeInTheDocument();
    const invite = calls.find((call) => call.url.endsWith('/invitations')) as Request;
    expect(await invite.json()).toEqual({ email: 'new@example.com', role: 'viewer' });
  });

  it('invites an unknown address to the product team instead', async () => {
    const me = makeMe({ role: 'product_owner', permissions: [...PRODUCT_PERMS] });
    const path = `/v1/products/${PRODUCT}/members`;
    const calls = mockApi(
      me,
      (request, url) => {
        if (url.pathname === path && request.method === 'GET') return jsonResponse([]);
        if (url.pathname === path && request.method === 'POST')
          return jsonResponse({ code: 'not_found', status: 404 }, { status: 404 });
        if (url.pathname === `/v1/products/${PRODUCT}/invitations` && request.method === 'POST')
          return jsonResponse(productInvitationCreated('x@example.com'), { status: 201 });
        return undefined;
      },
      [...tenantRoles, ...productRoles],
    );
    renderWithProviders(
      <MembersPanel
        productId={PRODUCT}
        scope="product"
        caption="Members"
        queryKey={['test', 'product-members-invite']}
        list={() => productsApi.members(PRODUCT)}
        add={(body) => productsApi.addMember(PRODUCT, body)}
        updateRole={(userId, next) => productsApi.updateMember(PRODUCT, userId, next)}
        remove={(userId) => productsApi.removeMember(PRODUCT, userId)}
        invite={(body) => productsApi.invite(PRODUCT, body)}
        canManage
      />,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Add member' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByRole('textbox', { name: /Email address/ }),
      'x@example.com',
    );
    const select = within(dialog).getByRole('combobox', { name: /Role/ });
    await within(select).findByRole('option', { name: /Product viewer/ });
    await user.selectOptions(select, 'product_viewer');
    await user.click(within(dialog).getByRole('button', { name: 'Add member' }));
    await user.click(
      await within(dialog).findByRole('button', { name: 'Send invitation instead' }),
    );
    expect(await within(dialog).findByLabelText('Invitation token')).toBeInTheDocument();
    const invite = calls.find(
      (call) => call.method === 'POST' && call.url.endsWith(`/products/${PRODUCT}/invitations`),
    ) as Request;
    expect(await invite.json()).toEqual({ email: 'x@example.com', role: 'product_viewer' });
  });

  it('explains the 404 for product members when inviting is not offered', async () => {
    const me = {
      ...makeMe({ role: null, permissions: [] }),
      platform_role: 'platform_admin',
    } as Me;
    const path = `/v1/products/${PRODUCT}/members`;
    mockApi(me, (request, url) => {
      if (url.pathname === path && request.method === 'GET') return jsonResponse([]);
      if (url.pathname === path && request.method === 'POST')
        return jsonResponse({ code: 'not_found', status: 404 }, { status: 404 });
      return undefined;
    });
    renderWithProviders(
      <MembersPanel
        productId={PRODUCT}
        scope="product"
        caption="Members"
        queryKey={['test', 'product-members']}
        list={() => productsApi.members(PRODUCT)}
        add={(body) => productsApi.addMember(PRODUCT, body)}
        updateRole={(userId, next) => productsApi.updateMember(PRODUCT, userId, next)}
        remove={(userId) => productsApi.removeMember(PRODUCT, userId)}
        canManage
      />,
    );
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Add member' }));
    const dialog = await screen.findByRole('dialog');
    await user.type(
      within(dialog).getByRole('textbox', { name: /Email address/ }),
      'x@example.com',
    );
    // Product roles are not in this catalog mock (tenant roles only): free-text input.
    await user.type(within(dialog).getByRole('textbox', { name: /Role/ }), 'product_viewer');
    await user.click(within(dialog).getByRole('button', { name: 'Add member' }));
    expect(
      await within(dialog).findByText(/Product members must already have an account/),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(within(dialog).queryByRole('button', { name: 'Send invitation instead' })).toBeNull(),
    );
  });
});

describe('InvitationsPanel for a product team', () => {
  it('lists, invites with a product role and revokes product team invitations', async () => {
    const me = makeMe({ role: 'product_owner', permissions: [...PRODUCT_PERMS] });
    const path = `/v1/products/${PRODUCT}/invitations`;
    const calls = mockApi(
      me,
      (request, url) => {
        if (url.pathname === path && request.method === 'GET')
          return jsonResponse([
            {
              id: 'pinv_1',
              product_id: PRODUCT,
              email: 'ops@example.com',
              role: 'product_admin',
              status: 'pending',
              invited_by: 'usr_me',
              created_at: '2026-11-01T00:00:00Z',
              expires_at: '2030-01-01T00:00:00Z',
              accepted_at: null,
              revoked_at: null,
            },
          ]);
        if (url.pathname === path && request.method === 'POST')
          return jsonResponse(productInvitationCreated('new@example.com'), { status: 201 });
        if (url.pathname === `${path}/pinv_1` && request.method === 'DELETE')
          return new Response(null, { status: 204 });
        return undefined;
      },
      [...tenantRoles, ...productRoles],
    );
    renderWithProviders(<InvitationsPanel productId={PRODUCT} canManage />);
    const user = userEvent.setup();
    expect(await screen.findByText('ops@example.com')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Invite member' }));
    const dialog = await screen.findByRole('dialog');
    const select = within(dialog).getByRole('combobox', { name: /Role/ });
    await within(select).findByRole('option', { name: /Product viewer/ });
    // Product roles only, the weakest preselected.
    expect(select).toHaveValue('product_viewer');
    expect(within(select).queryByRole('option', { name: /^Member/ })).toBeNull();
    expect(within(dialog).getByText(/this role in the product team/)).toBeInTheDocument();
    await user.type(within(dialog).getByRole('textbox', { name: /Email/ }), 'new@example.com');
    await user.click(within(dialog).getByRole('button', { name: /Send invitation/ }));
    expect(await within(dialog).findByLabelText('Invitation token')).toBeInTheDocument();
    const post = calls.find((call) => call.method === 'POST' && call.url.endsWith(path)) as Request;
    expect(await post.json()).toEqual({ email: 'new@example.com', role: 'product_viewer' });
    await user.click(within(dialog).getByRole('button', { name: 'Done' }));

    await user.click(screen.getByRole('button', { name: 'Revoke invitation for ops@example.com' }));
    const confirm = await screen.findByRole('dialog');
    await user.click(within(confirm).getByRole('button', { name: 'Revoke invitation' }));
    await waitFor(() =>
      expect(
        calls.some((call) => call.method === 'DELETE' && call.url.endsWith(`${path}/pinv_1`)),
      ).toBe(true),
    );
    // The tenant endpoints are never used for the product team.
    expect(calls.some((call) => call.url.includes('/tenants/'))).toBe(false);
  });
});

describe('InvitationsPanel role ceiling', () => {
  it('defaults to the first grantable role and disables the others', async () => {
    const me = makeMe({ role: 'product_support', permissions: [...VIEWER, 'members:manage'] });
    const calls = mockApi(me, (request, url) => {
      const path = `/v1/products/${PRODUCT}/tenants/${TENANT}/invitations`;
      if (url.pathname === path && request.method === 'GET') return jsonResponse([]);
      if (url.pathname === path && request.method === 'POST')
        return jsonResponse(
          {
            invitation: { id: 'inv_1', email: 'v@example.com', role: 'viewer', status: 'pending' },
            token: 'tok',
            accept_url: null,
          },
          { status: 201 },
        );
      return undefined;
    });
    renderWithProviders(<InvitationsPanel productId={PRODUCT} tenantId={TENANT} canManage />);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Invite member' }));
    const dialog = await screen.findByRole('dialog');
    const select = within(dialog).getByRole('combobox', { name: /Role/ });
    await within(select).findByRole('option', { name: /^Member \(above/ });
    expect(select).toHaveValue('viewer');
    await user.type(within(dialog).getByRole('textbox', { name: /Email/ }), 'v@example.com');
    await user.click(within(dialog).getByRole('button', { name: /Send invitation/ }));
    await waitFor(() => expect(calls.some((call) => call.method === 'POST')).toBe(true));
    const post = calls.find((call) => call.method === 'POST') as Request;
    expect(await post.json()).toEqual({ email: 'v@example.com', role: 'viewer' });
  });
});
