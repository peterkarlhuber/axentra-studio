import { describe, expect, it } from 'vitest';
import type { Me, Product, ProductAccess, Tenant } from '@/api/models';
import {
  canAccess,
  canInAnyTenant,
  isPlatformAdmin,
  permissionMatches,
  productAccess,
} from './permissions';

const now = '2026-01-01T00:00:00Z';
const product = (id: string): Product => ({
  id,
  slug: id,
  name: id,
  description: '',
  status: 'active',
  version: 1,
  created_at: now,
  updated_at: now,
});
const tenant = (id: string): Tenant => ({
  id,
  product_id: 'p1',
  slug: id,
  name: id,
  status: 'active',
  version: 1,
  created_at: now,
  updated_at: now,
});

const access: ProductAccess = {
  product: product('p1'),
  role: 'product_support',
  permissions: ['product:read', 'tenants:read'],
  tenants: [{ tenant: tenant('t1'), role: 'tenant_admin', permissions: ['members:manage'] }],
};

function me(overrides: Partial<Me> = {}): Me {
  return {
    user: null,
    actor_kind: 'user',
    platform_role: null,
    platform_permissions: [],
    products: [access],
    ...overrides,
  } as Me;
}

describe('permissions', () => {
  it('matches exact names and wildcards', () => {
    expect(permissionMatches('tenants:read', 'tenants:read')).toBe(true);
    expect(permissionMatches('*', 'anything')).toBe(true);
    expect(permissionMatches('tenants:*', 'tenants:delete')).toBe(true);
    expect(permissionMatches('tenants:*', 'members:read')).toBe(false);
    expect(permissionMatches('tenants:read', 'tenants:create')).toBe(false);
  });

  it('grants platform permissions everywhere', () => {
    const admin = me({ platform_role: 'platform_admin', platform_permissions: ['users:manage'] });
    expect(isPlatformAdmin(admin)).toBe(true);
    expect(canAccess(admin, 'users:manage')).toBe(true);
    expect(canAccess(admin, 'users:manage', access, 't1')).toBe(true);
    expect(isPlatformAdmin(me({ platform_role: 'platform_viewer' }))).toBe(false);
  });

  it('applies product roles to the product and tenant roles to their tenant only', () => {
    const user = me();
    const scoped = productAccess(user, 'p1');
    expect(scoped).toBe(access);
    expect(productAccess(user, 'p2')).toBeUndefined();
    expect(canAccess(user, 'tenants:read', scoped)).toBe(true);
    expect(canAccess(user, 'tenants:delete', scoped)).toBe(false);
    expect(canAccess(user, 'members:manage', scoped, 't1')).toBe(true);
    expect(canAccess(user, 'members:manage', scoped, 't2')).toBe(false);
    expect(canAccess(user, 'members:manage', scoped)).toBe(false);
    expect(canInAnyTenant(scoped, 'members:manage')).toBe(true);
  });

  it('denies everything without a session', () => {
    expect(canAccess(null, 'product:read')).toBe(false);
  });
});
