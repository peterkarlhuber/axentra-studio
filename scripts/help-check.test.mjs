import { describe, expect, it } from 'vitest';
import { analyze, checkHelp, codeTopics, LOCALES, readManifest } from './help-check.mjs';

describe('help center content', () => {
  it('all articles exist in all six locales with the same anchors, structure and valid links', () => {
    const { problems, articles } = checkHelp();
    expect(problems).toEqual([]);
    expect(articles).toBeGreaterThan(30);
    expect(LOCALES).toEqual(['en', 'de', 'es', 'fr', 'pt-BR', 'it']);
  });

  it('reads the manifest and the help topics used by screens', () => {
    const ids = readManifest();
    expect(ids).toContain('tenants');
    expect(new Set(ids).size).toBe(ids.length);
    const topics = codeTopics();
    // Every area links its page to the help center.
    expect(topics.length).toBeGreaterThan(50);
  });

  it('analyzes anchors, callouts, links and missing anchors', () => {
    const info = analyze(
      [
        '---',
        'title: T',
        'summary: S',
        'keywords: k',
        '---',
        '',
        'Intro with [a link](help:tenants#create).',
        '',
        '## First {#first}',
        '',
        '> [!WARNING]',
        '> Careful.',
        '',
        '## Second',
        '',
        '```diagram',
        'hierarchy',
        '```',
      ].join('\n'),
    );
    expect(info.anchors).toEqual(['first']);
    expect(info.links).toEqual(['help:tenants#create']);
    expect(info.diagrams).toEqual(['hierarchy']);
    expect(info.shape).toEqual(['paragraph', 'h2', 'callout:WARNING', 'h2', 'diagram:hierarchy']);
    expect(info.problems).toEqual(['heading without {#anchor}: "Second"']);
  });
});
