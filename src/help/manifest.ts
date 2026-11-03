/**
 * Structure of the in-app help center: chapters and articles, in reading order.
 *
 * This file is the single source of truth for the help center's structure. Article text lives in
 * `content/<locale>/<articleId>.md` (one file per article and locale, see docs/HELP_AUTHORING.md);
 * chapter titles are i18n keys `help:chapters.<chapterId>`. `npm run help:check` verifies that
 * every article listed here exists in all six locales with the same section anchors.
 */

export const HELP_CHAPTERS = [
  {
    id: 'introduction',
    articles: ['overview', 'concepts'],
  },
  {
    id: 'gettingStarted',
    articles: ['first-run-setup', 'signing-in', 'interface', 'first-steps'],
  },
  {
    id: 'identity',
    articles: ['products', 'tenants', 'members-invitations', 'users'],
  },
  {
    id: 'access',
    articles: ['roles-permissions', 'api-keys'],
  },
  {
    id: 'data',
    articles: ['data-overview', 'records', 'files', 'search'],
  },
  {
    id: 'events',
    articles: ['jobs', 'schedules', 'events', 'webhooks'],
  },
  {
    id: 'billing',
    articles: ['usage', 'plans-subscriptions'],
  },
  {
    id: 'notifications',
    articles: ['notifications'],
  },
  {
    id: 'administration',
    articles: ['audit', 'health-monitoring', 'settings', 'profile'],
  },
  {
    id: 'developers',
    articles: ['api-basics', 'server-configuration'],
  },
  {
    id: 'security',
    articles: ['security'],
  },
  {
    id: 'tutorials',
    articles: ['tutorial-onboard-customer', 'tutorial-webhook-receiver', 'tutorial-plan-usage'],
  },
  {
    id: 'troubleshooting',
    articles: ['troubleshooting', 'faq'],
  },
  {
    id: 'reference',
    articles: [
      'permissions-reference',
      'modules-reference',
      'keyboard-accessibility',
      'glossary',
      'limitations',
    ],
  },
] as const;

export type HelpChapterId = (typeof HELP_CHAPTERS)[number]['id'];
export type HelpArticleId = (typeof HELP_CHAPTERS)[number]['articles'][number];

/** A link target: an article, optionally with a section anchor (`tenants#suspend`). */
export type HelpTopic = HelpArticleId | `${HelpArticleId}#${string}`;

export const HELP_ARTICLE_IDS: readonly HelpArticleId[] = HELP_CHAPTERS.flatMap(
  (chapter) => chapter.articles,
);

export function chapterOf(articleId: HelpArticleId): HelpChapterId {
  const chapter = HELP_CHAPTERS.find((c) => (c.articles as readonly string[]).includes(articleId));
  if (!chapter) throw new Error(`unknown help article ${articleId}`);
  return chapter.id;
}

export function isHelpArticleId(value: string): value is HelpArticleId {
  return (HELP_ARTICLE_IDS as readonly string[]).includes(value);
}

export function splitTopic(topic: HelpTopic): { article: HelpArticleId; anchor?: string } {
  const [article, anchor] = topic.split('#') as [HelpArticleId, string | undefined];
  return anchor ? { article, anchor } : { article };
}
