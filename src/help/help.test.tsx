import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { FormField, Input, PageHeader } from '@/components/ui';
import i18n from '@/i18n';
import { renderWithProviders } from '@/test/utils';
import { loadLibrary, parseArticle } from './content';
import { errorTopic } from './error-topics';
import { parseFrontMatter, splitHeadingAnchor } from './frontmatter';
import { HelpArticlePage } from './HelpArticlePage';
import { HelpHomePage } from './HelpHomePage';
import { HelpLink } from './HelpLink';
import { HelpProvider } from './HelpProvider';
import { InfoTip } from './InfoTip';
import { HELP_ARTICLE_IDS, splitTopic } from './manifest';
import { HelpSearchIndex, normalize, snippet, tokenize } from './search';

const SAMPLE = [
  '---',
  'title: "Rotate keys: safely"',
  'summary: How rotation works.',
  'keywords: rotate, grace period, Schlüssel',
  'related: api-keys, security',
  '---',
  '',
  'Intro text about **API keys**.',
  '',
  '## Rotate a key {#rotate}',
  '',
  '1. Open the key.',
  '2. Choose **Rotate**.',
  '',
  '### Grace period {#grace-period}',
  '',
  'The old secret keeps working for a while.',
].join('\n');

describe('front matter and anchors', () => {
  it('parses fields, strips quotes and splits lists', () => {
    const { meta, body } = parseFrontMatter(SAMPLE);
    expect(meta.title).toBe('Rotate keys: safely');
    expect(meta.keywords).toEqual(['rotate', 'grace period', 'Schlüssel']);
    expect(meta.related).toEqual(['api-keys', 'security']);
    expect(body.startsWith('\nIntro')).toBe(true);
  });

  it('splits explicit heading anchors', () => {
    expect(splitHeadingAnchor('Create a tenant {#create}')).toEqual({
      text: 'Create a tenant',
      id: 'create',
    });
    expect(splitHeadingAnchor('No anchor')).toEqual({ text: 'No anchor', id: null });
  });

  it('collects h2/h3 headings for the table of contents', () => {
    const article = parseArticle('api-keys', 'en', SAMPLE);
    expect(article.headings).toEqual([
      { id: 'rotate', text: 'Rotate a key', level: 2 },
      { id: 'grace-period', text: 'Grace period', level: 3 },
    ]);
    expect(article.related).toEqual(['api-keys', 'security']);
  });

  it('maps topics and error codes', () => {
    expect(splitTopic('tenants#suspend')).toEqual({ article: 'tenants', anchor: 'suspend' });
    expect(errorTopic('rate_limited')).toBe('troubleshooting#rate-limited');
    expect(errorTopic('something_new')).toBe('troubleshooting#unknown');
  });
});

describe('search', () => {
  it('normalizes case and diacritics', () => {
    expect(normalize('Schlüssel ÉTÉ')).toBe('schlussel ete');
    expect(tokenize('API-Schlüssel, erneuern!')).toEqual(['api', 'schlussel', 'erneuern']);
  });

  it('ranks title matches first and deep-links the best section', () => {
    const rotate = parseArticle('api-keys', 'en', SAMPLE);
    const other = parseArticle(
      'tenants',
      'en',
      '---\ntitle: Tenants\nsummary: Customers.\nkeywords: customer\n---\n\n## Suspend {#suspend}\n\nA suspended tenant keeps its API keys but nobody can rotate anything.\n',
    );
    const index = new HelpSearchIndex(
      new Map([
        ['api-keys', rotate],
        ['tenants', other],
      ]),
    );
    const results = index.search('rotate');
    expect(results.map((r) => r.article)).toEqual(['api-keys', 'tenants']);
    expect(results[0]?.anchor).toBe('rotate');
    expect(index.search('grace')[0]?.anchor).toBe('grace-period');
    expect(index.search('schlussel')[0]?.article).toBe('api-keys');
    expect(index.search('zzz')).toEqual([]);
  });

  it('builds a snippet around the match', () => {
    const text = `${'a '.repeat(200)}needle ${'b '.repeat(200)}`;
    const result = snippet(text, ['needle']);
    expect(result).toContain('needle');
    expect(result.startsWith('…')).toBe(true);
  });
});

describe('content library', () => {
  it('loads every article in English and German', async () => {
    for (const locale of ['en', 'de'] as const) {
      const library = await loadLibrary(locale);
      expect([...library.keys()].sort()).toEqual([...HELP_ARTICLE_IDS].sort());
      for (const article of library.values()) {
        expect(article.title).not.toBe('');
        expect(article.summary).not.toBe('');
      }
    }
  });

  it('German articles inherit related topics from English', async () => {
    const de = await loadLibrary('de');
    const en = await loadLibrary('en');
    expect(de.get('tenants')?.related).toEqual(en.get('tenants')?.related);
  });
});

describe('help center pages', () => {
  it('renders an article with table of contents, callouts and related topics', async () => {
    renderWithProviders(
      <HelpProvider>
        <Routes>
          <Route path="/help/:articleId" element={<HelpArticlePage />} />
        </Routes>
      </HelpProvider>,
      { route: '/help/api-keys' },
    );
    const title = await screen.findByRole('heading', { level: 1, name: 'API keys' });
    expect(title).toBeInTheDocument();
    expect(screen.getAllByText('On this page').length).toBeGreaterThan(0);
    expect(document.getElementById('rotate')).not.toBeNull();
    expect(screen.getAllByRole('navigation', { name: 'Help chapters' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Related topics' })).toBeInTheDocument();
  });

  it('shows a not-found state for an unknown article', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/help/:articleId" element={<HelpArticlePage />} />
      </Routes>,
      { route: '/help/does-not-exist' },
    );
    expect(await screen.findByText('Article not found')).toBeInTheDocument();
  });

  it('searches from the home page and links results to sections', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/help" element={<HelpHomePage />} />
      </Routes>,
      { route: '/help' },
    );
    expect(await screen.findByRole('heading', { name: 'Start here' })).toBeInTheDocument();
    await user.type(
      screen.getByRole('searchbox', { name: 'Search the help center' }),
      'grace period',
    );
    const results = await screen.findByRole('heading', { name: /results? for "grace period"/ });
    const list = results.parentElement as HTMLElement;
    const first = within(list).getAllByRole('link')[0];
    expect(first?.getAttribute('href')).toMatch(/^\/help\/api-keys#/);
  });

  it('renders the help center in Spanish when the UI language is Spanish', async () => {
    await i18n.changeLanguage('es');
    try {
      renderWithProviders(
        <Routes>
          <Route path="/help" element={<HelpHomePage />} />
        </Routes>,
        { route: '/help' },
      );
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Centro de ayuda' }),
      ).toBeInTheDocument();
    } finally {
      await i18n.changeLanguage('en');
    }
  });
});

describe('contextual help', () => {
  it('opens the side panel at the requested section and keeps the page', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <HelpProvider>
        <p>Form page</p>
        <HelpLink topic="api-keys#rotate">How rotation works</HelpLink>
      </HelpProvider>,
    );
    const link = screen.getByRole('link', { name: 'How rotation works' });
    expect(link).toHaveAttribute('href', '/help/api-keys#rotate');
    await user.click(link);
    const panel = await screen.findByRole('dialog', { name: 'API keys' });
    await waitFor(() => expect(panel.querySelector('#help-panel-rotate')).not.toBeNull());
    expect(within(panel).getByRole('link', { name: 'Open in help center' })).toHaveAttribute(
      'href',
      '/help/api-keys#rotate',
    );
    expect(screen.getByText('Form page')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('info tips open with the keyboard, explain and close with Escape', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <HelpProvider>
        <InfoTip label="About grace period" topic="api-keys#grace-period">
          The old secret keeps working until the grace period ends.
        </InfoTip>
      </HelpProvider>,
    );
    const button = screen.getByRole('button', { name: 'About grace period' });
    button.focus();
    await user.keyboard('{Enter}');
    expect(await screen.findByText(/keeps working until/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
      'href',
      '/help/api-keys#grace-period',
    );
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByText(/keeps working until/)).not.toBeInTheDocument());
    expect(button).toHaveFocus();
  });

  it('FormField shows an info tip next to the label and PageHeader a help button', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <HelpProvider>
        <PageHeader title="API keys" help="api-keys" />
        <FormField label="Grace period" info="How long the old secret still works.">
          <Input />
        </FormField>
      </HelpProvider>,
    );
    expect(screen.getByRole('textbox', { name: 'Grace period' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'About Grace period' }));
    expect(await screen.findByText('How long the old secret still works.')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('button', { name: 'Help for this page' }));
    expect(await screen.findByRole('dialog', { name: 'API keys' })).toBeInTheDocument();
  });
});
