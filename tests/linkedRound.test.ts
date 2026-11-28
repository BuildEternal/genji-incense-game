import { describe, expect, it } from 'vitest';
import rawBuckets from '../data/genji_buckets.json';
import poemsJsonl from '../data/genji_poems_v2.jsonl?raw';
import { areLinked, parseLinkedDatabase } from '../src/buckets';
import { candidateGroups, generateLinkedRound, roundViolation, TEMPLATES } from '../src/linkedRound';
import { hookTokens, normalizeText } from '../src/normalize';

const db = parseLinkedDatabase(poemsJsonl, rawBuckets);
const group = (...ids: number[]) => {
  const bucket = db.bucketOf.get(ids[0])!;
  return { bucket, poemIds: ids, links: bucket.links.filter(l => l.poems.every(id => ids.includes(id))) };
};

describe('normalization', () => {
  it('expands iteration marks and maps common kanji without touching stored text', () => {
    expect(normalizeText('はゝき木')).toBe('ははきき');
    expect(normalizeText('なく〱も')).toBe('なくなくも');
    expect(hookTokens('竹河・ふし')).toEqual(['たけかは', 'ふし']);
    expect(normalizeText(db.poems.get(599)!.japanese)).toContain('たけかは');
  });
});

describe('linked round generator', () => {
  it.each(Object.entries(TEMPLATES))('builds fair %s rounds for many seeds', (_, template) => {
    for (let i = 0; i < 60; i++) {
      const cards = generateLinkedRound(db, `seed-${i}`, { template });
      expect(cards).toHaveLength(5);
      expect(new Set(cards.map(card => card.poem.poem_id)).size).toBe(5);
      const sizes = [...new Set(cards.map(c => c.groupIndex))].map(g => cards.filter(c => c.groupIndex === g).length);
      expect(sizes.sort()).toEqual([...template].sort());
      for (const a of cards) for (const b of cards) if (a !== b) {
        if (a.groupIndex === b.groupIndex) expect(a.bucket).toBe(b.bucket);
        else {
          expect(a.bucket).not.toBe(b.bucket);
          expect(a.poem.chapter_number).not.toBe(b.poem.chapter_number);
        }
      }
      for (const card of cards.filter(c => cards.filter(d => d.groupIndex === c.groupIndex).length === 2)) {
        const partner = cards.find(d => d !== card && d.groupIndex === card.groupIndex)!;
        expect(areLinked(db, card.poem.poem_id, partner.poem.poem_id)).toBe(true);
      }
    }
  });

  it('reproduces a seed and varies across seeds', () => {
    const ids = (seed: string) => generateLinkedRound(db, seed).map(card => card.poem.poem_id);
    expect(ids('repeat')).toEqual(ids('repeat'));
    expect(new Set(Array.from({ length: 20 }, (_, i) => ids(String(i)).join())).size).toBeGreaterThan(15);
  });

  it('never offers an unlinked pair as a group', () => {
    const pairs = candidateGroups(db, 2).map(g => g.poemIds.join('-'));
    expect(pairs).toContain('597-612');
    expect(pairs).not.toContain('598-611');
    expect(pairs).not.toContain('567-568');
  });

  it('rejects the known traps', () => {
    // Same bucket shown as two groups (plum suitor bucket).
    expect(roundViolation(db, [group(597, 598), group(611, 612)])).toMatch(/bucket/);
    // Suma letters to different women share あま/しほ: same chapter, and an echo of the hook.
    expect(roundViolation(db, [group(189, 191), group(190, 192)])).not.toBeNull();
    expect(roundViolation(db, [group(189, 191), group(190, 192)], false)).toMatch(/echo/);
    // A common-word hook still blocks other poems that repeat it: 竹河 appears only in its bucket.
    expect(roundViolation(db, [group(599, 600), group(26, 27), group(206)])).toBeNull();
  });

  it('allows same-chapter groups in hard mode when nothing else conflicts', () => {
    const pairs = candidateGroups(db, 2);
    const single = candidateGroups(db, 1);
    const found = pairs.flatMap(a => pairs.filter(b =>
      a.bucket !== b.bucket && db.poems.get(a.poemIds[0])!.chapter_number === db.poems.get(b.poemIds[0])!.chapter_number
      && roundViolation(db, [a, b, single[0]], false) === null).map(b => [a, b]));
    expect(found.length).toBeGreaterThan(0);
    const [a, b] = found[0];
    expect(roundViolation(db, [a, b, single[0]], true)).toMatch(/chapter/);
  });
});
