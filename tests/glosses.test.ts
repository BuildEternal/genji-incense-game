// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import rawBuckets from '../data/genji_buckets.json';
import rawGlosses from '../data/genji_glosses.json';
import pilot from '../data/genji_poetry_exchanges_pilot.json';
import poemsJsonl from '../data/genji_poems_v2.jsonl?raw';
import { parseLinkedDatabase } from '../src/buckets';
import { mountLinkedGame } from '../src/linkedApp';
import { correctLabels, generateLinkedRound } from '../src/linkedRound';

const db = parseLinkedDatabase(poemsJsonl, rawBuckets, rawGlosses);

describe('English glosses', () => {
  it('cover every poem exactly once', () => {
    expect(db.glosses.size).toBe(db.poems.size);
    expect(db.poems.size).toBe(795);
  });

  it('reuse the pilot glosses verbatim', () => {
    for (const exchange of pilot.exchanges)
      for (const poem of exchange.poems)
        expect(db.glosses.get(poem.poem_id)?.english).toBe(poem.english_game_gloss);
  });

  it('reject glosses for unknown or duplicated poems', () => {
    const base = { translation_credits: 'test' };
    expect(() => parseLinkedDatabase(poemsJsonl, rawBuckets, { ...base, glosses: [{ poem_id: 9999, english: 'x' }] })).toThrow(/unknown poem/);
    expect(() => parseLinkedDatabase(poemsJsonl, rawBuckets, { ...base, glosses: [{ poem_id: 1, english: 'x' }, { poem_id: 1, english: 'y' }] })).toThrow(/Duplicate gloss/);
  });

  it('show English with the Japanese original, and notes only after submission', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const root = document.querySelector<HTMLDivElement>('#app')!;
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    mountLinkedGame(root, db);
    const cards = generateLinkedRound(db, 'genji-full-1');
    root.querySelector<HTMLButtonElement>('#start-button')!.click();
    for (let i = 0; i < 5; i++) {
      expect(root.querySelector('blockquote')!.textContent).toBe(db.glosses.get(cards[i].poem.poem_id)!.english);
      expect(root.querySelectorAll('[lang="ja"]')).toHaveLength(1);
      expect(root.textContent).toContain('Provisional English gloss');
      expect(root.querySelector('.gloss-note')).toBeNull();
      root.querySelector<HTMLButtonElement>('#next')!.click();
    }
    root.querySelectorAll<HTMLSelectElement>('.assignment select').forEach((select, i) => {
      select.value = correctLabels(cards)[i];
      select.dispatchEvent(new Event('change'));
    });
    root.querySelector<HTMLButtonElement>('#submit-answer')!.click();
    for (const card of cards) expect(root.textContent).toContain(db.glosses.get(card.poem.poem_id)!.english);
    const notes = cards.filter(card => db.glosses.get(card.poem.poem_id)!.note).length;
    expect(root.querySelectorAll('.gloss-note')).toHaveLength(notes);
  });
});
