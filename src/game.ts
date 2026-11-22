import { z } from 'zod';

const text = z.string().trim().min(1);
const sourceUrl = z.url().refine(value => ['https:', 'http:'].includes(new URL(value).protocol));
const poemSchema = z.object({
  poem_id: z.number().int().positive(),
  exchange_role: z.enum(['initiation', 'reply']),
  speaker: text,
  recipient: text,
  // Validation must not transform the original transcription.
  japanese: z.string().refine(value => {
    const units = value.split('/');
    return units.length === 5 && units.every(unit => unit.trim().length > 0);
  }, 'Expected five nonempty Japanese verse units'),
  english_game_gloss: text,
});

const exchangeSchema = z.object({
  exchange_id: text,
  chapter_number: z.number().int().min(1).max(54),
  chapter_romaji: text,
  chapter_english: text,
  context: text,
  response_mechanism: text,
  motif_tags: z.array(text).min(1),
  difficulty_provisional: z.enum(['easy', 'medium', 'hard']),
  poems: z.array(poemSchema).length(2).refine(poems =>
    new Set(poems.map(poem => poem.exchange_role)).size === 2,
  'Expected an initiation and a reply'),
  source_urls: z.array(sourceUrl).min(1),
  verification: z.object({
    status: text,
    original_text_checked: z.boolean(),
    reply_relation_supported: z.boolean(),
    review_note: text,
  }),
});

const datasetSchema = z.object({
  dataset_id: text,
  version: text,
  translation_credits: text,
  exchanges: z.array(exchangeSchema).min(3),
}).superRefine((dataset, ctx) => {
  const exchangeIds = dataset.exchanges.map(exchange => exchange.exchange_id);
  const poemIds = dataset.exchanges.flatMap(exchange => exchange.poems.map(poem => poem.poem_id));
  if (new Set(exchangeIds).size !== exchangeIds.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate exchange IDs' });
  if (new Set(poemIds).size !== poemIds.length)
    ctx.addIssue({ code: 'custom', message: 'Duplicate poem IDs' });
});

export type Dataset = z.infer<typeof datasetSchema>;
export type Exchange = Dataset['exchanges'][number];
export type Poem = Exchange['poems'][number];
export type Card = { poem: Poem; exchange: Exchange };

export function parseDataset(value: unknown): Dataset {
  return datasetSchema.parse(value);
}

// Version 1: FNV-1a seed hash, Mulberry32 PRNG, Fisher–Yates shuffle.
// Keep these stable so a seed reproduces a round for this dataset/version.
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

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function validateRound(cards: readonly Card[]): void {
  if (cards.length !== 5 || new Set(cards.map(card => card.poem.poem_id)).size !== 5)
    throw new Error('A round needs five unique poems');
  const counts = new Map<string, number>();
  for (const card of cards) {
    if (!card.exchange.poems.some(poem => poem.poem_id === card.poem.poem_id))
      throw new Error('Poem does not belong to its exchange');
    counts.set(card.exchange.exchange_id, (counts.get(card.exchange.exchange_id) ?? 0) + 1);
  }
  if ([...counts.values()].sort().join(',') !== '1,2,2')
    throw new Error('This prototype requires a 2+2+1 partition');
}

export function generateRound(dataset: Dataset, seed: string): Card[] {
  if (!seed.trim()) throw new Error('A round needs a nonempty seed');
  const random = seededRandom(seed);
  const [first, second, solo] = shuffled(dataset.exchanges, random);
  const cards = shuffled([
    ...first.poems.map(poem => ({ poem, exchange: first })),
    ...second.poems.map(poem => ({ poem, exchange: second })),
    { poem: solo.poems[Math.floor(random() * 2)], exchange: solo },
  ], random);
  validateRound(cards);
  return cards;
}

export function canonicalLabels(values: readonly string[]): string[] {
  const labels = new Map<string, string>();
  return values.map(value => {
    if (!labels.has(value)) labels.set(value, String.fromCharCode(65 + labels.size));
    return labels.get(value)!;
  });
}

export function scoreRound(cards: readonly Card[], assignments: readonly string[]) {
  validateRound(cards);
  if (assignments.length !== 5 || assignments.some(value => !value.trim()))
    throw new Error('Assign a group to every poem');
  const correct = canonicalLabels(cards.map(card => card.exchange.exchange_id));
  const submitted = canonicalLabels(assignments);
  let matchingPairsFound = 0;
  let falseMatches = 0;
  let pairwiseCorrect = 0;
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {
    const actualMatch = correct[i] === correct[j];
    const guessedMatch = submitted[i] === submitted[j];
    if (actualMatch && guessedMatch) matchingPairsFound++;
    if (!actualMatch && guessedMatch) falseMatches++;
    if (actualMatch === guessedMatch) pairwiseCorrect++;
  }
  return {
    correct, submitted, matchingPairsFound, falseMatches, pairwiseCorrect,
    exact: correct.every((label, index) => label === submitted[index]),
  };
}
