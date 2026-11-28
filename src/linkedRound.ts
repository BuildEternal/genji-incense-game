import type { Bucket, Link, LinkedDatabase, LinkedPoem } from './buckets';
import { drawPackets } from './genjiko';
import { englishWords, hookTokens, normalizeText } from './normalize';

// Round generator for the linked-bucket database. Round rules (data/genji_buckets_README.md):
// 1. Poems are grouped only through listed links (a 3-poem group must be connected by links).
// 2. Each group, singletons included, comes from a different bucket.
// 3. Echo check: no poem outside a group may contain one of that group's hook words
//    (Japanese hook in the Japanese text; hook_en words in the English gloss, when glosses are loaded).
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

/** Every showable group of a given size: one poem, or 2–5 poems of one bucket connected by its links. */
export function candidateGroups(db: LinkedDatabase, size: number): Group[] {
  if (size === 1) return [...db.poems.keys()].map(id => ({ bucket: db.bucketOf.get(id)!, poemIds: [id], links: [] }));
  const groups: Group[] = [];
  const choose = (ids: number[], k: number, start = 0, picked: number[] = []): number[][] =>
    picked.length === k ? [picked] : ids.slice(start).flatMap((id, i) => choose(ids, k, start + i + 1, [...picked, id]));
  for (const bucket of db.buckets) {
    if (bucket.poem_ids.length < size) continue;
    for (const members of choose(bucket.poem_ids, size)) {
      const links = bucket.links.filter(link => link.poems.every(id => members.includes(id)));
      if (connected(members, links)) groups.push({ bucket, poemIds: members, links });
    }
  }
  return groups;
}

// Every member reachable from the first through links (for three poems: at least two of three pairs linked).
function connected(members: number[], links: Link[]): boolean {
  const seen = new Set([members[0]]);
  for (let grew = true; grew;) {
    grew = false;
    for (const { poems: [a, b] } of links)
      if (seen.has(a) !== seen.has(b)) { seen.add(a); seen.add(b); grew = true; }
  }
  return seen.size === members.length;
}

const textCache = new WeakMap<LinkedDatabase, Map<number, string>>();
function normalizedText(db: LinkedDatabase, id: number): string {
  let cache = textCache.get(db);
  if (!cache) textCache.set(db, (cache = new Map()));
  if (!cache.has(id)) cache.set(id, normalizeText(db.poems.get(id)!.japanese));
  return cache.get(id)!;
}

const englishCache = new WeakMap<LinkedDatabase, Map<number, Set<string>>>();
function glossWords(db: LinkedDatabase, id: number): Set<string> | undefined {
  const gloss = db.glosses.get(id);
  if (!gloss) return undefined;
  let cache = englishCache.get(db);
  if (!cache) englishCache.set(db, (cache = new Map()));
  if (!cache.has(id)) cache.set(id, englishWords(gloss.english));
  return cache.get(id);
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
    const english = [...new Set(group.links.flatMap(link => link.hook_en ?? []).flatMap(word => [...englishWords(word)]))];
    for (const other of all) {
      if (other.index === index) continue;
      const word = english.find(w => glossWords(db, other.id)?.has(w));
      if (word) return `echo: poem ${other.id} repeats English hook "${word}"`;
    }
  }
  if (sameChapterRule) for (const x of all) for (const y of all)
    if (x.id < y.id && x.index !== y.index && db.poems.get(x.id)!.chapter_number === db.poems.get(y.id)!.chapter_number)
      return `same chapter: ${x.id} and ${y.id}`;
  return null;
}

/**
 * Builds a fair round. By default the shape comes from the real Genji-kō draw (25 packets,
 * five drawn), so every one of the 52 patterns has its real-life odds, and poems are placed
 * in the drawn positions. Passing `template` instead fixes the group sizes and shuffles.
 */
export function generateLinkedRound(db: LinkedDatabase, seed: string, options: RoundOptions = {}): LinkedCard[] {
  if (!seed.trim()) throw new Error('A round needs a nonempty seed');
  const random = seededRandom(seed);
  let positions: number[] | undefined; // incense label for each of the five positions
  let template = options.template;
  if (!template) {
    positions = drawPackets(random);
    const order = [...new Set(positions)];
    template = order.map(label => positions!.filter(value => value === label).length);
    positions = positions.map(label => order.indexOf(label));
  }
  if (template.reduce((sum, size) => sum + size, 0) !== 5 || template.some(size => size < 1 || size > 5))
    throw new Error('A template needs group sizes of 1–5 summing to 5');
  const pools = new Map(template.map(size => [size, poolCache(db, size)]));
  for (let attempt = 0; attempt < (options.maxAttempts ?? 4000); attempt++) {
    const groups = template.map(size => pick(pools.get(size)!, random));
    if (roundViolation(db, groups, options.sameChapterRule ?? true)) continue;
    const card = (group: Group, groupIndex: number, id: number): LinkedCard => ({
      poem: db.poems.get(id)!, bucket: group.bucket, groupIndex, hooks: group.links.map(link => link.hook),
    });
    if (!positions) return shuffled(groups.flatMap((group, i) => group.poemIds.map(id => card(group, i, id))), random);
    const queues = groups.map(group => shuffled(group.poemIds, random));
    return positions.map(groupIndex => card(groups[groupIndex], groupIndex, queues[groupIndex].shift()!));
  }
  throw new Error('No fair round found for this seed');
}

const pools = new WeakMap<LinkedDatabase, Map<number, Group[]>>();
function poolCache(db: LinkedDatabase, size: number): Group[] {
  let cache = pools.get(db);
  if (!cache) pools.set(db, (cache = new Map()));
  if (!cache.has(size)) cache.set(size, candidateGroups(db, size));
  return cache.get(size)!;
}

/** Groups as canonical labels by first appearance, e.g. [A, B, A, C, B]. */
export function correctLabels(cards: readonly LinkedCard[]): string[] {
  const labels = new Map<number, string>();
  return cards.map(card => {
    if (!labels.has(card.groupIndex)) labels.set(card.groupIndex, String.fromCharCode(65 + labels.size));
    return labels.get(card.groupIndex)!;
  });
}

export function scoreLinkedRound(cards: readonly LinkedCard[], assignments: readonly string[]) {
  if (cards.length !== 5 || assignments.length !== 5 || assignments.some(value => !value.trim()))
    throw new Error('Assign a group to every poem');
  const canon = (values: readonly string[]) => {
    const map = new Map<string, string>();
    return values.map(v => { if (!map.has(v)) map.set(v, String.fromCharCode(65 + map.size)); return map.get(v)!; });
  };
  const correct = correctLabels(cards);
  const submitted = canon(assignments);
  let actualPairs = 0, matchingPairsFound = 0, falseMatches = 0;
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {
    const actual = correct[i] === correct[j];
    const guessed = submitted[i] === submitted[j];
    if (actual) actualPairs++;
    if (actual && guessed) matchingPairsFound++;
    if (!actual && guessed) falseMatches++;
  }
  return { correct, submitted, actualPairs, matchingPairsFound, falseMatches,
    exact: correct.every((label, index) => label === submitted[index]) };
}
