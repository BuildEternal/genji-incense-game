import { z } from 'zod';

// Schema for the linked-bucket database (data/genji_buckets.json + data/genji_poems_v2.jsonl).
// A bucket = poems that must never be shown as different groups in one round.
// A link = a pair that may be shown together as a group; its hook is the shared wording.

const text = z.string().trim().min(1);
const poemId = z.number().int().min(1);

const poemSchema = z.object({
  poem_id: poemId,
  chapter_number: z.number().int().min(1).max(54),
  // Validation must not transform the original transcription.
  japanese: z.string().refine(value => {
    const units = value.split('/');
    return units.length === 5 && units.every(unit => unit.trim().length > 0);
  }, 'Expected five nonempty Japanese verse units'),
  speaker: text,
  original_page_url: z.url(),
}).loose();

const linkSchema = z.object({
  poems: z.tuple([poemId, poemId]).refine(([a, b]) => a !== b, 'A link needs two different poems'),
  hook: text,
});

const bucketSchema = z.object({
  bucket_id: text,
  kind: z.enum(['single', 'exchange', 'chorus', 'solo']),
  poem_ids: z.array(poemId).min(1),
  context: text,
  links: z.array(linkSchema),
  weak_links: z.array(linkSchema).optional(),
  split_from: text.optional(),
  merged_from: z.array(text).optional(),
});

const bucketFileSchema = z.object({
  dataset_id: text,
  version: text,
  poem_database: text,
  buckets: z.array(bucketSchema).min(1),
}).loose();

export type LinkedPoem = z.infer<typeof poemSchema>;
export type Link = z.infer<typeof linkSchema>;
export type Bucket = z.infer<typeof bucketSchema>;
export type LinkedDatabase = { poems: Map<number, LinkedPoem>; buckets: Bucket[]; bucketOf: Map<number, Bucket> };

const pairKey = ([a, b]: readonly [number, number]) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export function parseLinkedDatabase(poemsJsonl: string, bucketsJson: unknown): LinkedDatabase {
  const poemList = poemsJsonl.split('\n').filter(line => line.trim()).map(line => poemSchema.parse(JSON.parse(line)));
  const poems = new Map<number, LinkedPoem>();
  for (const poem of poemList) {
    if (poems.has(poem.poem_id)) throw new Error(`Duplicate poem ${poem.poem_id}`);
    poems.set(poem.poem_id, poem);
  }
  const { buckets } = bucketFileSchema.parse(bucketsJson);
  const bucketIds = new Set<string>();
  const bucketOf = new Map<number, Bucket>();
  for (const bucket of buckets) {
    if (bucketIds.has(bucket.bucket_id)) throw new Error(`Duplicate bucket ${bucket.bucket_id}`);
    bucketIds.add(bucket.bucket_id);
    for (const id of bucket.poem_ids) {
      if (!poems.has(id)) throw new Error(`${bucket.bucket_id}: unknown poem ${id}`);
      if (bucketOf.has(id)) throw new Error(`Poem ${id} is in ${bucketOf.get(id)!.bucket_id} and ${bucket.bucket_id}`);
      bucketOf.set(id, bucket);
    }
    const members = new Set(bucket.poem_ids);
    const seen = new Set<string>();
    for (const link of [...bucket.links, ...(bucket.weak_links ?? [])]) {
      for (const id of link.poems)
        if (!members.has(id)) throw new Error(`${bucket.bucket_id}: link poem ${id} is not in the bucket`);
      const key = pairKey(link.poems);
      if (seen.has(key)) throw new Error(`${bucket.bucket_id}: pair ${key} listed twice`);
      seen.add(key);
    }
    if (bucket.kind === 'single' && bucket.poem_ids.length !== 1)
      throw new Error(`${bucket.bucket_id}: kind "single" needs exactly one poem`);
  }
  for (const id of poems.keys())
    if (!bucketOf.has(id)) throw new Error(`Poem ${id} is not in any bucket`);
  return { poems, buckets, bucketOf };
}

/** True when the two poems may be shown together as one group. */
export function areLinked(db: LinkedDatabase, a: number, b: number): boolean {
  const bucket = db.bucketOf.get(a);
  if (!bucket || bucket !== db.bucketOf.get(b)) return false;
  const key = pairKey([a, b]);
  return bucket.links.some(link => pairKey(link.poems) === key);
}
