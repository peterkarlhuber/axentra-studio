import { describe, expect, it } from 'vitest';
import type { ApiKey } from '@/api/models';
import { derivedKeys } from './derived-keys';

const key = (id: string, createdBy: string | null, status = 'active') =>
  ({ id, created_by: createdBy, status, name: id, prefix: id }) as unknown as ApiKey;

describe('derivedKeys', () => {
  it('finds the active keys created with a key, transitively, and skips revoked ones', () => {
    const all = [
      key('k1', 'usr_1'),
      key('k2', 'k1'),
      key('k3', 'k2'),
      key('k4', 'k1', 'revoked'),
      key('k5', 'k4'),
      key('k6', 'usr_1'),
    ];
    expect(derivedKeys(all, 'k1').map((k) => k.id)).toEqual(['k2', 'k3', 'k5']);
    expect(derivedKeys(all, 'k6')).toEqual([]);
  });

  it('stops on a cycle', () => {
    expect(derivedKeys([key('a', 'b'), key('b', 'a')], 'a').map((k) => k.id)).toEqual(['b']);
  });
});
