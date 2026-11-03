import { describe, expect, it } from 'vitest';
import { decodeEntities, kindsProblem, parseHighlight, parseKinds } from './search-utils';

describe('parseHighlight', () => {
  it('splits matches from text', () => {
    expect(parseHighlight('Q3 <mark>roadmap</mark> and <mark>plan</mark>')).toEqual([
      { text: 'Q3 ', match: false },
      { text: 'roadmap', match: true },
      { text: ' and ', match: false },
      { text: 'plan', match: true },
    ]);
  });

  it('keeps escaped markup as visible text and never creates elements from it', () => {
    expect(parseHighlight('&lt;script&gt;alert(1)&lt;/script&gt; <mark>x</mark> &amp; y')).toEqual([
      { text: '<script>alert(1)</script> ', match: false },
      { text: 'x', match: true },
      { text: ' & y', match: false },
    ]);
  });

  it('decodes numeric entities and tolerates empty input', () => {
    expect(decodeEntities('it&#x27;s &#34;ok&#34;')).toBe('it\'s "ok"');
    expect(parseHighlight('')).toEqual([]);
    expect(parseHighlight(null)).toEqual([]);
  });
});

describe('kinds', () => {
  it('splits on commas and spaces and drops duplicates', () => {
    expect(parseKinds(' invoice, note  invoice,,')).toEqual(['invoice', 'note']);
  });

  it('reports invalid kinds and too many kinds', () => {
    expect(kindsProblem(['invoice', 'Note'])).toEqual({ reason: 'invalid', kind: 'Note' });
    expect(kindsProblem(Array.from({ length: 21 }, (_, i) => `k${i}`))).toEqual({
      reason: 'tooMany',
    });
    expect(kindsProblem(['invoice', 'support.ticket'])).toBeNull();
  });
});
