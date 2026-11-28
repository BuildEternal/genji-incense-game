import type { Bucket, Link, LinkedDatabase, LinkedPoem } from './buckets';
import { hookTokens, normalizeText } from './normalize';

// Round generator for the linked-bucket database. Round rules (data/genji_buckets_README.md):
// 1. Poems are grouped only through listed links (a 3-poem group must be connected by links).
// 2. Each group, singletons included, comes from a different bucket.
// 3. Echo check: no poem outside a group may contain one of that group's hook words.
// 4. Normal mode: no two poems from the same chapter unless they are in one group.

export type Template = readonly number[]; // group sizes, e.g. [2, 2, 1]; must sum to 5
export const TEMPLATES: Record<string, Template> = {
  '2+2+1': [2, 2, 1],
  '2+1+1+1': [2, 1, 1, 1],
  '3+1+1': [3, 1, 1],
  '3+2': [3, 2],
};

export type LinkedCard = { poem: LinkedPoem; bucket: Bucket; groupIndex: number; hooks: string[] };
export type RoundOptions = { template?: Template; sameChapterRule?: boolean; maxAttempts?: number };

type Group = { bucket: Bucket; poemIds: number[]; links: Link[] };

function seededRandom(seed: string) {
  let state = 2166136261;
  for (let i = 0; i < seed.length; i++) state = Math.imul(state ^ seed.charCodeAt(i), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(values: readonly T[], random: () => number): T => values[Math.floor(random() * values.length)];
function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** Every showable group of a given size: link pairs, or link-connected triples within one bucket. */
export function candidateGroups(db: LinkedDatabase, size: number): Group[] {
  if (size === 1) return [...db.poems.keys()].map(id => ({ bucket: db.bucketOf.get(id)!, poemIds: [id], links: [] }));
  const groups: Group[] = [];
  for (const bucket of db.buckets) {
    if (size === 2) for (const link of bucket.links) groups.push({ bucket, poemIds: [...link.poems], links: [link] });
    if (size === 3) {
      const ids = bucket.poem_ids;
      for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) for (let c = b + 1; c < ids.length; c++) {
        const members = [ids[a], ids[b], ids[c]];
        const links = bucket.links.filter(link => link.poems.every(id => members.includes(id)));
        // Three poems are connected by links when at least two of the three pairs are linked.
        if (links.length >= 2) groups.push({ bucket, poemIds: members, links });
      }
    }
  }
  return groups;
}

const textCache = new WeakMap<LinkedDatabase, Map<number, string>>();
function normalizedText(db: LinkedDatabase, id: number): string {
  let cache = textCache.get(db);
  if (!cache) textCache.set(db, (cache = new Map()));
  if (!cache.has(id)) cache.set(id, normalizeText(db.poems.get(id)!.japanese));
  return cache.get(id)!;
}

/** Returns the first broken rule for a proposed set of groups, or null when the round is fair. */
export function roundViolation(db: LinkedDatabase, groups: readonly Group[], sameChapterRule = true): string | null {
  const buckets = new Set(groups.map(group => group.bucket.bucket_id));
  if (buckets.size !== groups.length) return 'two groups from one bucket';
  const all = groups.flatMap((group, index) => group.poemIds.map(id => ({ id, index })));
  if (new Set(all.map(entry => entry.id)).size !== all.length) return 'repeated poem';
  for (const [index, group] of groups.entries()) {
    const tokens = group.links.flatMap(link => hookTokens(link.hook));
    for (const other of all) {
      if (other.index === index) continue;
      const token = tokens.find(t => normalizedText(db, other.id).includes(t));
      if (token) return `echo: poem ${other.id} repeats hook ${token}`;
    }
  }
  if (sameChapterRule) for (const x of all) for (const y of all)
    if (x.id < y.id && x.index !== y.index && db.poems.get(x.id)!.chapter_number === db.poems.get(y.id)!.chapter_number)
      return `same chapter: ${x.id} and ${y.id}`;
  return null;
}

export function generateLinkedRound(db: LinkedDatabase, seed: string, options: RoundOptions = {}): LinkedCard[] {
  if (!seed.trim()) throw new Error('A round needs a nonempty seed');
  const template = options.template ?? TEMPLATES['2+2+1'];
  if (template.reduce((sum, size) => sum + size, 0) !== 5 || template.some(size => size < 1 || size > 3))
    throw new Error('A template needs group sizes of 1–3 summing to 5');
  const random = seededRandom(seed);
  const pools = new Map(template.map(size => [size, candidateGroups(db, size)]));
  for (let attempt = 0; attempt < (options.maxAttempts ?? 2000); attempt++) {
    const groups = template.map(size => pick(pools.get(size)!, random));
    if (roundViolation(db, groups, options.sameChapterRule ?? true)) continue;
    const cards = groups.flatMap((group, groupIndex) => group.poemIds.map(id => ({
      poem: db.poems.get(id)!, bucket: group.bucket, groupIndex, hooks: group.links.map(link => link.hook),
    })));
    return shuffled(cards, random);
  }
  throw new Error('No fair round found for this seed and template');
}
