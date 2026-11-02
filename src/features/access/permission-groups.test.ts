import { describe, expect, it } from 'vitest';
import type { Permission } from '@/api/models';
import { grantableFor, groupPermissions } from './permission-groups';

const perm = (name: string, scope: Permission['scope'], extra: Partial<Permission> = {}) =>
  ({ name, scope, description: '', ...extra }) as Permission;

const catalog = [
  perm('crm.deals:approve', 'tenant', { source: 'product' }),
  perm('tenants:read', 'product'),
  perm('records:write', 'tenant'),
  perm('records:read', 'tenant'),
  perm('crm.reports:export', 'product', { source: 'product' }),
  perm('crm.old:thing', 'tenant', { source: 'product', retired_at: '2026-11-01T00:00:00Z' }),
  perm('users:read', 'platform'),
];

describe('groupPermissions', () => {
  it('groups by resource, built-in groups first, product groups marked', () => {
    const groups = groupPermissions(catalog);
    expect(groups.map((group) => [group.source, group.resource])).toEqual([
      ['builtin', 'records'],
      ['builtin', 'tenants'],
      ['builtin', 'users'],
      ['product', 'crm.deals'],
      ['product', 'crm.old'],
      ['product', 'crm.reports'],
    ]);
    expect(groups[0]?.items.map((item) => item.name)).toEqual(['records:read', 'records:write']);
  });
});

describe('grantableFor', () => {
  it('limits tenant roles to tenant permissions and drops platform and retired ones', () => {
    expect(grantableFor(catalog, 'tenant').map((p) => p.name)).toEqual([
      'crm.deals:approve',
      'records:write',
      'records:read',
    ]);
    expect(grantableFor(catalog, 'product').map((p) => p.name)).toEqual([
      'crm.deals:approve',
      'tenants:read',
      'records:write',
      'records:read',
      'crm.reports:export',
    ]);
  });
});
