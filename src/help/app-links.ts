import { NAVIGATION } from '@/app/navigation';

/**
 * Targets for `[text](app:<id>)` links in help articles: every sidebar item plus the screens
 * that are reached from the user menu. Product-scoped targets need a current product; without
 * one the link is rendered as plain text.
 */
const EXTRA_TARGETS: Record<string, { scope: 'platform'; path: string }> = {
  profile: { scope: 'platform', path: '/profile' },
  help: { scope: 'platform', path: '/help' },
};

export const APP_LINK_IDS: readonly string[] = [
  ...NAVIGATION.flatMap((group) => group.items.map((item) => item.id)),
  ...Object.keys(EXTRA_TARGETS),
];

export function resolveAppLink(id: string, productId: string | undefined): string | null {
  const extra = EXTRA_TARGETS[id];
  if (extra) return extra.path;
  for (const group of NAVIGATION) {
    const item = group.items.find((candidate) => candidate.id === id);
    if (!item) continue;
    if (item.scope === 'product' && !productId) return null;
    return item.to(productId ?? '');
  }
  return null;
}
