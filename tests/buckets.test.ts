import { describe, expect, it } from 'vitest';
import rawBuckets from '../data/genji_buckets.json';
import { areLinked, parseLinkedDatabase } from '../src/buckets';
import poemsJsonl from '../data/genji_poems_v2.jsonl?raw';

const db = parseLinkedDatabase(poemsJsonl, rawBuckets);

describe('linked bucket database', () => {
  it('covers all 795 poems exactly once', () => {
    expect(db.poems.size).toBe(795);
    expect(db.buckets.flatMap(bucket => bucket.poem_ids)).toHaveLength(795);
    expect(db.buckets).toHaveLength(428);
  });

  it('preserves every Japanese transcription from the poem file', () => {
    const original = poemsJsonl.split('\n').filter(Boolean).map((line: string) => JSON.parse(line).japanese);
    expect([...db.poems.values()].map(poem => poem.japanese)).toEqual(original);
  });

  it('applies the agreed membership changes', () => {
    expect(db.bucketOf.get(224)!.bucket_id).not.toBe(db.bucketOf.get(226)!.bucket_id);
    expect(db.bucketOf.get(644)).toBe(db.bucketOf.get(650));
    expect(db.bucketOf.get(431)).toBe(db.bucketOf.get(435));
    expect(areLinked(db, 431, 435)).toBe(true);
  });

  it('links only pairs with a recorded hook, not every pair in a bucket', () => {
    expect(areLinked(db, 597, 612)).toBe(true);   // 花に心をうつす quoted back
    expect(areLinked(db, 598, 611)).toBe(false);  // same bucket, no shared wording
    expect(db.bucketOf.get(598)).toBe(db.bucketOf.get(611));
    expect(areLinked(db, 26, 206)).toBe(false);   // different buckets
  });

  const mutations: [string, (copy: typeof rawBuckets) => void][] = [
    ['a poem in two buckets', copy => { copy.buckets[1].poem_ids.push(copy.buckets[0].poem_ids[0]); }],
    ['a missing poem', copy => {
      const bucket = copy.buckets.find(b => b.poem_ids.length === 2)!;
      bucket.poem_ids = [bucket.poem_ids[0]];
      bucket.links = [];
    }],
    ['a link outside its bucket', copy => {
      const bucket = copy.buckets.find(b => b.links.length)!;
      bucket.links[0].poems[0] = 795;
    }],
    ['an empty hook', copy => { copy.buckets.find(b => b.links.length)!.links[0].hook = ' '; }],
    ['a duplicate bucket id', copy => { copy.buckets[1].bucket_id = copy.buckets[0].bucket_id; }],
  ];
  it.each(mutations)('rejects %s', (_, mutate) => {
    const copy = structuredClone(rawBuckets);
    mutate(copy);
    expect(() => parseLinkedDatabase(poemsJsonl, copy)).toThrow();
  });
});
