import { describe, expect, it } from 'vitest';
import raw from '../data/genji_poetry_exchanges_pilot.json';
import { canonicalLabels, generateRound, parseDataset, scoreRound, validateRound, type Card } from '../src/game';

const dataset = parseDataset(raw);
const fixture: Card[] = [26, 206, 638, 207, 27].map(id => {
  const exchange = dataset.exchanges.find(exchange => exchange.poems.some(poem => poem.poem_id === id))!;
  return { exchange, poem: exchange.poems.find(poem => poem.poem_id === id)! };
});

describe('curated pilot integrity', () => {
  it('contains the documented coverage and preserves every Japanese transcription', () => {
    expect(dataset.exchanges).toHaveLength(15);
    expect(dataset.exchanges.flatMap(exchange => exchange.poems)).toHaveLength(30);
    expect(new Set(dataset.exchanges.map(exchange => exchange.chapter_number)).size).toBe(14);
    expect(dataset.exchanges.flatMap(exchange => exchange.poems.map(poem => poem.japanese)))
      .toEqual(raw.exchanges.flatMap(exchange => exchange.poems.map(poem => poem.japanese)));
  });

  it.each([
    ['duplicate exchange IDs', (copy: typeof raw) => { copy.exchanges[1].exchange_id = copy.exchanges[0].exchange_id; }],
    ['duplicate poem IDs', (copy: typeof raw) => { copy.exchanges[1].poems[0].poem_id = copy.exchanges[0].poems[0].poem_id; }],
    ['wrong roles', (copy: typeof raw) => { copy.exchanges[0].poems[1].exchange_role = 'initiation'; }],
    ['missing verse units', (copy: typeof raw) => { copy.exchanges[0].poems[0].japanese = 'one/two'; }],
    ['empty verse units', (copy: typeof raw) => { copy.exchanges[0].poems[0].japanese = 'one/two//four/five'; }],
    ['invalid source URLs', (copy: typeof raw) => { copy.exchanges[0].source_urls[0] = 'javascript:alert(1)'; }],
    ['missing English', (copy: typeof raw) => { copy.exchanges[0].poems[0].english_game_gloss = ''; }],
  ])('rejects %s', (_, mutate) => {
    const copy = structuredClone(raw);
    mutate(copy);
    expect(() => parseDataset(copy)).toThrow();
  });
});

describe('round generation', () => {
  it('reproduces a seed, varies seeds, and never mutates the collection', () => {
    const before = structuredClone(dataset);
    expect(generateRound(dataset, 'repeat')).toEqual(generateRound(dataset, 'repeat'));
    const rounds = Array.from({ length: 20 }, (_, i) => generateRound(dataset, String(i)).map(card => card.poem.poem_id).join(','));
    expect(new Set(rounds).size).toBeGreaterThan(1);
    expect(dataset).toEqual(before);
  });

  it('has five distinct poems with a 2+2+1 partition across 100 seeds', () => {
    for (let i = 0; i < 100; i++) {
      const cards = generateRound(dataset, `round-${i}`);
      expect(() => validateRound(cards)).not.toThrow();
      expect(new Set(cards.map(card => card.poem.poem_id)).size).toBe(5);
      const ids = cards.map(card => card.exchange.exchange_id);
      expect([...new Set(ids)].map(id => ids.filter(value => value === id).length).sort()).toEqual([1, 2, 2]);
    }
  });

  it('rejects duplicates, wrong length, wrong partition, and an empty seed', () => {
    expect(() => validateRound([...fixture.slice(0, 4), fixture[0]])).toThrow();
    expect(() => validateRound(fixture.slice(1))).toThrow();
    const singletons = dataset.exchanges.slice(0, 5).map(exchange => ({ exchange, poem: exchange.poems[0] }));
    expect(() => validateRound(singletons)).toThrow();
    expect(() => generateRound(dataset, ' ')).toThrow();
  });

  it('keeps two exchanges from chapter 46 separate', () => {
    const exchanges = ['GK-013', 'GK-014', 'GK-003'].map(id => dataset.exchanges.find(exchange => exchange.exchange_id === id)!);
    const cards = exchanges.flatMap((exchange, i) => exchange.poems.slice(0, i === 2 ? 1 : 2).map(poem => ({ exchange, poem })));
    expect(cards[0].exchange.chapter_number).toBe(cards[2].exchange.chapter_number);
    expect(scoreRound(cards, ['A', 'A', 'B', 'B', 'C']).exact).toBe(true);
    expect(scoreRound(cards, ['A', 'A', 'A', 'A', 'C']).exact).toBe(false);
  });
});

describe('partition scoring', () => {
  it('accepts any equivalent relabeling of the documented fixture', () => {
    expect(canonicalLabels(fixture.map(card => card.exchange.exchange_id))).toEqual(['A', 'B', 'C', 'B', 'A']);
    expect(scoreRound(fixture, ['X', 'Z', 'Y', 'Z', 'X'])).toMatchObject({ exact: true, matchingPairsFound: 2, falseMatches: 0, pairwiseCorrect: 10 });
  });

  it('does not mistake all singletons or all connected for a correct answer', () => {
    expect(scoreRound(fixture, ['A', 'B', 'C', 'D', 'E'])).toMatchObject({ exact: false, matchingPairsFound: 0, pairwiseCorrect: 8 });
    expect(scoreRound(fixture, ['A', 'A', 'A', 'A', 'A'])).toMatchObject({ exact: false, matchingPairsFound: 2, falseMatches: 8 });
    expect(() => scoreRound(fixture, ['A', '', 'C', 'B', 'A'])).toThrow();
    expect(() => scoreRound(fixture, ['A'])).toThrow();
  });
});
