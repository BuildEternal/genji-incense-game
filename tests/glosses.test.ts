// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import rawBuckets from '../data/genji_buckets.json';
import rawGlosses from '../data/genji_glosses.json';
import pilot from '../data/genji_poetry_exchanges_pilot.json';
import poemsJsonl from '../data/genji_poems_v2.jsonl?raw';
import { parseLinkedDatabase } from '../src/buckets';
import { mountLinkedGame } from '../src/linkedApp';
import { candidateGroups, correctLabels, generateLinkedRound, roundViolation, TEMPLATES } from '../src/linkedRound';
import { englishWords } from '../src/normalize';

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
    const cards = generateLinkedRound(db, 'genji-game-1#1');
    root.querySelector<HTMLButtonElement>('#start-button')!.click();
    for (let i = 0; i < 5; i++) {
      expect(root.querySelector('blockquote')!.textContent).toBe(db.glosses.get(cards[i].poem.poem_id)!.english);
      expect(root.querySelectorAll('main .ja')).toHaveLength(1);
      expect(root.textContent).toContain('Provisional English gloss');
      expect(root.querySelector('.gloss-note')).toBeNull();
      root.querySelector<HTMLButtonElement>('#next')!.click();
    }
    correctLabels(cards).forEach((label, i) => {
      for (let k = 0; k <= label.charCodeAt(0) - 65; k++) root.querySelector<HTMLButtonElement>(`.dye[data-poem="${i}"]`)!.click();
    });
    root.querySelector<HTMLButtonElement>('#submit-answer')!.click();
    for (const card of cards) expect(root.textContent).toContain(db.glosses.get(card.poem.poem_id)!.english);
    const notes = cards.filter(card => db.glosses.get(card.poem.poem_id)!.note).length;
    expect(root.querySelectorAll('.gloss-note')).toHaveLength(notes);
  });
});

describe('English echo check', () => {
  it('every link has English hook words', () => {
    for (const bucket of db.buckets) for (const link of bucket.links) expect(link.hook_en?.length).toBeGreaterThan(0);
  });

  it('rejects a round where an unrelated poem reuses an English hook word', () => {
    const pairs = candidateGroups(db, 2);
    const singles = candidateGroups(db, 1);
    let found = false;
    for (const pair of pairs) {
      const word = pair.links[0].hook_en![0];
      const outsider = singles.find(single => single.bucket !== pair.bucket
        && englishWords(db.glosses.get(single.poemIds[0])!.english).has(word)
        && roundViolation(db, [pair, single], false)?.includes('English'));
      if (outsider) { found = true; break; }
    }
    expect(found).toBe(true);
  });

  it('generated rounds never show a group\'s English hook word in another group', () => {
    for (let i = 0; i < 100; i++) {
      const cards = generateLinkedRound(db, `en-echo-${i}`, { template: TEMPLATES['2+2+1'] });
      for (const card of cards) {
        const words = card.bucket.links.filter(link => link.poems.every(id => cards.some(c => c.poem.poem_id === id && c.groupIndex === card.groupIndex)))
          .flatMap(link => link.hook_en!);
        for (const other of cards) if (other.groupIndex !== card.groupIndex)
          for (const word of words) expect(englishWords(db.glosses.get(other.poem.poem_id)!.english).has(word)).toBe(false);
      }
    }
  });
});
