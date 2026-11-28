import { describe, expect, it } from 'vitest';
import rawBuckets from '../data/genji_buckets.json';
import rawGlosses from '../data/genji_glosses.json';
import poemsJsonl from '../data/genji_poems_v2.jsonl?raw';
import { areLinked, parseLinkedDatabase } from '../src/buckets';
import { canonicalKey, drawPackets, PATTERNS, patternFor, patternKey, patternSvg } from '../src/genjiko';
import { correctLabels, generateLinkedRound } from '../src/linkedRound';

const db = parseLinkedDatabase(poemsJsonl, rawBuckets, rawGlosses);
const shape = (key: string) => [...new Set(key)].map(c => [...key].filter(x => x === c).length).sort((a, b) => b - a).join('+');

// Exact odds of each shape under the real draw (5 incenses × 5 packets, draw 5).
const EXACT: Record<string, number> = {
  '2+1+1+1': 0.4705, '2+2+1': 0.2823, '3+1+1': 0.1412, '1+1+1+1+1': 0.0588, '3+2': 0.0376, '4+1': 0.0094, '5': 0.00009,
};

describe('Genji-kō patterns', () => {
  it('has 52 patterns, one for every way to group five, chapters 2–53', () => {
    expect(PATTERNS).toHaveLength(52);
    expect(new Set(PATTERNS.map(patternKey)).size).toBe(52);
    expect(PATTERNS.map(p => p.chapter)).toEqual(Array.from({ length: 52 }, (_, i) => i + 2));
    for (const p of PATTERNS) expect(p.groups.flat().sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('names known patterns', () => {
    expect(patternFor(['A', 'B', 'C', 'D', 'E']).ja).toBe('帚木');
    expect(patternFor(['A', 'A', 'A', 'A', 'A']).ja).toBe('手習');
    expect(patternFor([1, 2, 3, 2, 1]).ja).toBe('真木柱');
  });

  it('treats relabelings as the same pattern', () => {
    expect(canonicalKey(['C', 'A', 'C', 'B', 'A'])).toBe(canonicalKey(['A', 'B', 'A', 'C', 'B']));
    expect(patternFor(['E', 'D', 'E', 'C', 'D'])).toBe(patternFor(['A', 'B', 'A', 'C', 'B']));
  });

  it('draws shapes with their real-life odds', () => {
    let state = 1;
    const random = () => { state = (state * 48271) % 2147483647; return state / 2147483647; };
    const counts = new Map<string, number>();
    const n = 200000;
    for (let i = 0; i < n; i++) { const s = shape(canonicalKey(drawPackets(random))); counts.set(s, (counts.get(s) ?? 0) + 1); }
    for (const [s, p] of Object.entries(EXACT)) if (p > 0.001) expect(Math.abs((counts.get(s) ?? 0) / n - p)).toBeLessThan(0.005);
  });

  it('draws an SVG with five lines plus one bar per joined group', () => {
    for (const p of PATTERNS) {
      const lines = (patternSvg(p.groups).match(/<line /g) ?? []).length;
      expect(lines).toBe(5 + p.groups.filter(g => g.length > 1).length);
    }
  });
});

describe('rounds built from the real draw', () => {
  it('fill every shape, put poems in the drawn positions, and keep rounds fair', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1500; i++) {
      const cards = generateLinkedRound(db, `draw-${i}`);
      const labels = correctLabels(cards);
      seen.add(shape(labels.join('')));
      expect(new Set(cards.map(c => c.poem.poem_id)).size).toBe(5);
      patternFor(labels);
      for (const a of cards) for (const b of cards) if (a !== b && a.groupIndex !== b.groupIndex) expect(a.bucket).not.toBe(b.bucket);
      for (const g of new Set(cards.map(c => c.groupIndex))) {
        const ids = cards.filter(c => c.groupIndex === g).map(c => c.poem.poem_id);
        if (ids.length > 1) expect(ids.some(x => ids.some(y => x !== y && areLinked(db, x, y)))).toBe(true);
      }
    }
    for (const s of ['2+1+1+1', '2+2+1', '3+1+1', '1+1+1+1+1', '3+2', '4+1']) expect(seen).toContain(s);
  });

  it('can build 4-poem and 5-poem groups', () => {
    expect(generateLinkedRound(db, 'x', { template: [4, 1] })).toHaveLength(5);
    expect(new Set(generateLinkedRound(db, 'x', { template: [5] }).map(c => c.groupIndex)).size).toBe(1);
  });
});
