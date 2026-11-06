import type { ApiKey } from '@/api/models';

/**
 * The active keys revoking `rootId` also stops: keys created with it (their `created_by` is the
 * creating key's id) and, transitively, the keys created with those.
 */
export function derivedKeys(all: readonly ApiKey[], rootId: string): ApiKey[] {
  const found: ApiKey[] = [];
  const seen = new Set([rootId]);
  const queue = [rootId];
  while (queue.length) {
    const parent = queue.shift() as string;
    for (const candidate of all) {
      if (candidate.created_by !== parent || seen.has(candidate.id)) continue;
      seen.add(candidate.id);
      queue.push(candidate.id);
      if (candidate.status === 'active') found.push(candidate);
    }
  }
  return found;
}
