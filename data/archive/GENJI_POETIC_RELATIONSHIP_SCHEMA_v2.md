# Genji-kō — Canonical Poem and Exchange Databases (v2)

**Adopted:** 22 November 2026  
**Research coverage:** **795 / 795 indexed waka annotated** and assigned to **429 literary buckets** (all 54 chapters).  
**Next checkpoint:** review provisional literary boundaries and speaker attributions; prepare translated, playable poems.

## Design decision

The project records **which poems belong together through an established,
recognizable thematic connection grounded in the narrative**. A formal reply
is strong evidence, but is not a requirement: a shared poetry game, a linked
series of private compositions, or a distinctly recalled poetic occasion
can also form one unit.

The exchange database is a list of ordered poem-ID buckets with short narrative
context and optional notes. It deliberately does not prescribe game rules,
encode a long taxonomy of exchange types, or store reply-by-reply graphs,
selection eligibility, or statistics derived from the buckets.

**Terminology under consideration (28 November 2026):** The user suggested
rebranding these as *thematic poetic units* rather than strictly *exchanges*.
This is appropriate descriptive language and is now used in research audits.
The JSON container and IDs still use `exchanges` / `exchange_id` to avoid
breaking scripts or an eventual game implementation. A public terminology or
schema migration has **not** been formally decided or performed.

This is a literary database first. The eventual Genji-kō game will decide
which poems to display from each bucket for a particular round.

## Single-file game database and its component sources

### Game-facing consolidated file: `genji_database_v1.json`

The complete research output is also generated as **one JSON document**
containing a `poems` array of all 795 annotated poem records and an `exchanges`
array of 429 ordered thematic poetic units. Each exchange holds **only poem
IDs, context and notes**; Japanese texts and speaker metadata appear **once**
in the poem collection. Thus the two logical collections need not be stored
in separate files by the game.

The unified file is produced by the same builder as the two existing v2
component files and validated against them for exact equivalence. It is the
recommended **single artifact to load in the game**. The component files
remain available for compatibility and inspection, and the chapter-batched
files remain editable research sources and audit checkpoints.

### The two component files

#### 1. `genji_poems_v2.jsonl` — poems

One JSON object per line, **795 records**, ordered by global waka ID.

Every record retains the original Kōi indexed fields verbatim:

- `poem_id`
- `chapter_number`
- `chapter_title_ja`
- `japanese`
- `source_index_line` (line in the captured online index; a snapshot locator)

For **all 795 researched poems**, the record also contains:

- `speaker`
- `poem_role` (brief narrative/editorial role, when known)
- `japanese_prose_section`
- `original_page_url`, `original_page_line_in_snapshot`
- `annotation_page_url`, `annotation_line_in_snapshot`

There are **no unannotated indexed poems**. Having a complete indexed-poem
assignment does not imply that every grouping boundary is scholarly certain
or has been playtested for translated-game recognizability.

The original `genji_waka_inventory_v1.jsonl` remains unchanged as a permanent
reference transcription.

#### 2. `genji_exchanges_v2.json` — poetic buckets

The root object identifies the poem database and contains an `exchanges`
array. Each entry has only:

| Field | Meaning |
| --- | --- |
| `exchange_id` | Stable ID, preserving the original CHxx-nn numbering |
| `poem_ids` | Ordered list of indexed poems in the poetic unit |
| `context` | Short description of what occurs in the narrative |
| `notes` | Optional literary linkage or a specific unresolved question |

Example:

```json
{
  "exchange_id": "CH12-16",
  "poem_ids": [194, 195, 196, 197],
  "context": "Rokujō sends two verses in one letter from Ise; Genji's one return letter holds two corresponding answers.",
  "notes": "Poetic linkage: Ise/Suma, seaweed, sea travel, and salt-making. The four poems form one correspondence event containing two distinct answers."
}
```

This example is illustrative; the exact canonical context and notes may be
more detailed. No poem text, speakers, source URLs, category-specific fields,
or replicated poem-level records appear inside an exchange bucket.

**A one-poem bucket is valid:** it means a poem has no identified waka partner
in that particular narrated literary interaction. It can still be selected
alone in a later game round. The eventual game does not need to know whether
a lone displayed poem has additional partners elsewhere.

**Buckets can span chapters.** For instance, CH21-09 groups poems 336,
337, 364 and 365: the autumn exchange in *Otome* is explicitly resumed
in *Kochō*. The bucket notes identify the two separate occasions.
Buckets can also contain a directly inspired private composition rather
than only sent and answered messages: CH23-02 has poems 354–356, of which
356 is a private verse written after the preceding reply. These cases are
documented rather than expanded into special exchange types.

Later **recalled imagery can reconnect an earlier poetic occasion** even
within one chapter. In CH44-03, poems 599–600 and 617–618 share the specific
*Takekawa* song and explicitly recall the earlier evening; its present
four-poem unit records a two-pair alternative. CH44-04 is a six-poem
cherry-blossom contest (601–606), all in one narrated choral sequence.
The number of poems a game round can display is **not** a cap on the length
of a literary unit.

## Literary boundary and uncertainty

The purpose of a bucket is a **coherent poetic interaction**, not arbitrary
proximity in the novel. A farewell gathering with several poems might or might
not be one interaction. The primary question is literary and editorial; note
the ambiguity rather than inventing an eligibility rule.

For example, **CH18-01 (poems 283–285)** currently groups the three Akashi
family farewell poems but records that their individual addressees and direct
response boundaries are not entirely clear.

All previously documented nuanced source cases are retained in the older
research checkpoint JSONs and audits. Their key literary explanations and
editorial uncertainties were carried into the v2 buckets' prose notes, while
the per-poem source locators were moved into the poem database.

**Grouping review, 28 November 2026:** See
`GENJI_GROUPING_REVIEW_2026-11-28.md` for the complete 13-case inventory of
boundary ambiguities, the present provisional opinions, and the two still
especially contested decisions. The corresponding source exchange notes have
also been updated, so rebuilding this database preserves that reasoning.
No bucket memberships were changed in the review. In particular, the proposed
split of CH13-06 into [224,225] and [226,227] awaits an explicit decision;
CH12-16 remains a four-poem unit with a documented two-pair alternative.

The current **working game proposal** is to sample contiguous runs *within*
each ordered bucket, preserve the group's order when interleaving groups in
the sequential round, and assess fairness by both internal thematic cohesion
and distinction from competing groups. These are prospective algorithm rules,
not stored literary classifications or poem eligibility flags.

## Provenance and migration

The four older source research checkpoints remain intact:

- `genji_chapters_01_05_groups_v1.json`
- `genji_chapters_06_10_groups_v1.json`
- `genji_chapters_11_15_groups_v1.json`
- `genji_chapters_16_20_groups_v1.json`

These are **archives of the detailed literary research**, not the current
game-facing schema. Their older kind classifications, reply edges,
related-scene flags, and expanded audit notes remain available if a future
scholarly question requires them. Do not append v2 entries to the old
`groups[]` format merely to preserve its taxonomy.

New chapter batches are authored directly in the smaller v2 format as
**paired chapter-specific research files**:

- `genji_chapters_21_25_poem_annotations_v2.jsonl` — poem ID, speaker,
  role, original Japanese prose location, and commentary location only.
- `genji_chapters_21_25_exchanges_v2.json` — the ordered poem-ID
  buckets, contexts, and optional literary notes only.
- `genji_chapters_21_25_audit.md` — research decisions, provenance,
  boundary cases, and verification limits.
- `genji_chapters_26_30_poem_annotations_v2.jsonl`,
  `genji_chapters_26_30_exchanges_v2.json`, and
  `genji_chapters_26_30_audit.md` — the same three-part layout for
  the succeeding batch.
- `genji_chapters_31_33_poem_annotations_v2.jsonl`,
  `genji_chapters_31_33_exchanges_v2.json`, and
  `genji_chapters_31_33_audit.md` — the latest checkpoint; chapter 32
  includes an ordered five-poem chorus with a documented possible
  alternative seven-poem scene boundary.
- `genji_chapters_34_35_poem_annotations_v2.jsonl`,
  `genji_chapters_34_35_exchanges_v2.json`, and
  `genji_chapters_34_35_audit.md` — the succeeding checkpoint, including
  an Akashi family three-poem sequence and a documented, provisional
  grouping of two related private compositions.
- `genji_chapters_36_38_poem_annotations_v2.jsonl`,
  `genji_chapters_36_38_exchanges_v2.json`, and
  `genji_chapters_36_38_audit.md` — 25 poems in 13 buckets, including
  Kashiwagi's three-poem deathbed correspondence, a three-voice mourning
  sequence, an answer attributed to Shōshō no Kimi rather than the Second
  Princess, and a separate ghostly flute verse.
- `genji_chapters_39_40_poem_annotations_v2.jsonl`,
  `genji_chapters_39_40_exchanges_v2.json`, and
  `genji_chapters_39_40_audit.md` — 38 poems in 21 buckets, including a
  provisional six-poem linked Ono visit, a disputed private verse inscribed
  on a received letter, and three deathbed/departure mourning sequences.
- `genji_chapters_41_42_poem_annotations_v2.jsonl`,
  `genji_chapters_41_42_exchanges_v2.json`, and
  `genji_chapters_41_42_audit.md` — 27 poems in 17 buckets. Three private
  sequences have provisional shared-scene groupings: the spring garden
  (567–568), a summer evening's insects and fireflies (577–578), and the
  reading and burning of Murasaki's letters (585–586). All three record
  defensible singleton alternatives in their prose notes. Chapter 42
  has one indexed poem by Kaoru.
- `genji_chapters_43_44_poem_annotations_v2.jsonl`,
  `genji_chapters_43_44_exchanges_v2.json`, and
  `genji_chapters_43_44_audit.md` — 28 poems in nine thematic units. One
  provisional four-poem courtship unit in chapter 43 (591–594), two
  noncontiguous thematic continuations in chapter 44 (597–598/611–612
  and 599–600/617–618), and a clearly narrated six-poem sakura contest
  (601–606). The alternatives and source limits are in the unit notes.
- `genji_chapters_45_46_poem_annotations_v2.jsonl`,
  `genji_chapters_45_46_exchanges_v2.json`, and
  `genji_chapters_45_46_audit.md` — 34 poems in 17 thematic units. This
  includes a waterbird family chorus (619–621), Kashiwagi's two old poems
  in a packet later read by Kaoru (630–631), an unusual reply by Niou to a
  letter received by Kaoru (632–633), a recalled two-season cherry-blossom
  correspondence (634–635/651–652), and a three-poem deer correspondence
  with Ōigimi composing in Nakano Kimi's voice (638–640). Alternatives
  for two separate mourning scenes are documented, not silently merged.
  The commentary attribution for poem 630 conflicts with the original
  document's narration; the project follows Kashiwagi's historical authorship
  and records the discrepancy for later verification.
- `genji_chapters_47_48_poem_annotations_v2.jsonl`,
  `genji_chapters_47_48_exchanges_v2.json`, and
  `genji_chapters_47_48_audit.md` — 46 poems in 24 thematic units.
  This includes a five-voice Uji poetry sequence (668–672), a provisional
  pair of Kaoru's private winter-death laments (680–681), and a provisional
  four-poem noncontiguous Uji-River contrast (691–692/695–696), explicitly
  supported by a narrated comparison of divergent attitudes toward death
  and survival. Poem 660 is attributed to Kaoru based on the scene, despite
  a conflicting Yūgiri attribution in the Japanese editorial notes.
- `genji_chapters_49_50_poem_annotations_v2.jsonl`,
  `genji_chapters_49_50_exchanges_v2.json`, and
  `genji_chapters_49_50_audit.md` — 35 poems in 19 thematic units,
  including a three-verse morning-glory sequence (701–703), Nakano Kimi's
  two autumn-desertion poems (705/707), a four-voice imperial wisteria
  sequence (718–721), and a cross-chapter
  `yadorigi` unit (714–715/732–733, subsequently extended by poem 758 in chapter 52). Those three grouping boundaries are
  documented as provisional. The speaker of 720 is only probably Yūgiri.
  Chapter-49 editorial locators use embedded notes on the original prose
  page when the standalone notes page is unavailable for snapshot lookup.
- `genji_chapters_51_52_poem_annotations_v2.jsonl`,
  `genji_chapters_51_52_exchanges_v2.json`, and
  `genji_chapters_51_52_audit.md` — 33 new poems, **15 new thematic units**,
  and one new poem (758) retrospectively added to CH49-10, not duplicated.
  Includes a five-poem long-rains double correspondence (745–749), a
  provisional self-abandonment sequence (751–753), Ukifune's two farewell
  poems to her mother (754–755), and a four-poem maiden-flower salon
  exchange (762–765). The five-poem cross-chapter *yadorigi* unit
  [714,715,732,733,758] has a documented less-definite third occasion.
- `genji_chapters_53_54_poem_annotations_v2.jsonl`,
  `genji_chapters_53_54_exchanges_v2.json`, and
  `genji_chapters_53_54_audit.md` — the final 29 waka in 18 new units.
  The most interpretive connection is a nonconsecutive Uji-river/tears
  mirror between surviving Ukifune and mourning Kaoru (767,793); it is
  deliberately documented as a thematic link, not a direct reply.
  The chapter includes two consecutive private renunciation verses
  (782–783), proxy replies composed by the younger nun (770 and 772),
  and one unanswered final poem in chapter 54 (795). All boundaries
  requiring judgment are recorded with alternatives in the audit.

The annotation file does not duplicate poem texts or inventory fields.
The exchange file does not duplicate speakers, poem metadata, or the
original Japanese. Each future batch should use the same paired-source
naming convention.

`build_genji_simple_database.py` is the reproducible consolidation
of **both** archived old checkpoints and new minimal chapter research
into the unified database **and** the two compatible v2 component files.
Run it whenever chapter sources change; do not edit generated files
independently. It verifies that
every indexed poem remains identical and each researched poem occurs
in exactly one exchange bucket.

`genji_source_research_helper.py` is a small optional tool for inspecting
Japanese prose and editorial note rows by chapter and section while preparing
new batches; it does not automatically infer literary relationships or save
online source material in the exchange database.

## Verification

Run:

```bash
python3 validate_genji_simple_database.py
```

It checks:

1. All 795 poems preserve the original Japanese index fields verbatim.
2. All 795 researched poems preserve speaker, role, and Japanese text locations.
3. All 429 buckets preserve their IDs, poem order, and narrative context.
4. Every researched poem belongs to exactly one bucket.
5. No exchange record contains duplicated poem fields, derived game flags,
   exchange-type proliferations, or chapter summary counts.
6. The consolidated game-facing JSON matches the two component files exactly.

The four earlier batch validators remain usable for their archived source data.

**Limits:** This confirms data integrity, not the correctness of every
literary interpretation, attribution, or translation. The original Japanese
has been checked in an edited online edition and annotations, not against a
complete independent collation of printed critical editions.

## Continuing the project

**All 54 chapters have now been annotated.** The next task is not another
transcription batch: review specifically marked ambiguous poetic-unit
boundaries and speaker assignments, comparing their original-language
literary evidence to the game's goal of recognizable grouping. Then
establish reliable English translations and rights/attribution policy,
and playtest contiguous subsequences in presentation order. Keep all
game-round logic outside the relationship database; do not reintroduce
game-eligibility flags or an exchange-type taxonomy. Preserve the exact
source checkpoint files so any revised decision can be rebuilt and audited.

Keep the round-selection algorithm and difficulty model separate until the
literary database is sufficiently complete.
