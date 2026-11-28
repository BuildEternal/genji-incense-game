# Project development guidelines

## Read before changing the project

- Read `docs/PROJECT_CONTEXT.md`, then
  `data/genji_poetry_exchanges_README.md` and the relevant JSON records.
- Respect the context's DECIDED, WORKING BASELINE, TENTATIVE, DEFERRED, and OPEN
  distinctions. Proposed milestones are not permission to implement everything.
- Keep changes within the requested scope. Repository initialization includes
  documentation and file organization only; implement game functionality when
  requested. Do not silently settle open framework, language-mode, or UX choices.

## Preserve the curated material

- Treat `data/genji_poetry_exchanges_pilot.json` as curated source material.
  Do not rewrite, reformat, reorder, or regenerate it as a side effect of tooling
  or file moves. Content changes require an explicit editorial task.
- Preserve original Japanese exactly: historical kana, variant characters,
  iteration marks, spelling, and the `/` separators between five verse units.
  Do not silently normalize Unicode or modernize orthography. Put any future
  normalized or display form in a separate derived field, retaining the source.
- Keep `exchange_id` and source `poem_id` values stable. Preserve source URLs,
  attribution details, verification notes, and documented uncertainty.
- For relocations, verify byte-for-byte equality against the original files.
  Avoid unrelated changes to the database or its editorial documentation.

## Scholarly accuracy and translation

- Check who composed each poem, who sent and received it, its chapter, and the
  evidence for a direct reply. Distinguish narrated anecdotes and replies
  composed on another character's behalf from simple speaker attribution.
- Group by documented `exchange_id`. Shared chapter, author, motifs, or English
  keywords alone do not establish a historical poetic exchange. In particular,
  `GK-013` and `GK-014` are separate exchanges in the same chapter.
- Never invent missing verses, trial poem IDs, source references, or certainty.
  Record unresolved questions for review rather than silently correcting data.
- For authorized editorial changes, document the source, precise location when
  available, rationale, and review status. Retain textual variants and distinguish
  source evidence from interpretation. `cross_checked` is not scholarly sign-off.
- Label `english_game_gloss` text as provisional wherever it is presented.
  Preserve clue-bearing imagery and explain puns or allusions without claiming
  that English fully captures them. Changes can alter game difficulty and need
  literary review and playtesting.
- Do not import modern published translations without appropriate permission.
  Keep translation credits and source attribution; review source terms before
  publication, distinguishing historical text from modern editorial work.

## Future implementation and tests

- Preserve five unique poems per round, sequential presentation without access
  to earlier full texts during normal play, and legitimate singleton groups.
  Hide answer metadata until submission and explain actual exchanges afterward.
- The pilot contains exactly two poems per exchange. The full database
  (`data/genji_buckets.json`) has buckets of one to seven poems: show poems as a
  group only through a listed `link`, never show two poems of one bucket as
  different groups, and never fabricate links without a hook. See
  `data/genji_buckets_README.md`.
- Use recorded random seeds for reproducible generation. Compare partitions by
  group relationships so equivalent relabelings score identically. Treat
  difficulty ratings as uncalibrated until supported by player evidence.
- Add focused automated tests alongside future behavior: schema and required
  fields; unique exchange and poem IDs; initiation/reply roles; five-part Japanese
  texts; source URL structure; seeded generation; five-card uniqueness;
  singleton handling; partition relabeling; and chapter-46 exchange separation.
- Use the documented fixture `[26, 206, 638, 207, 27]`, whose correct partition
  is `[A, B, C, B, A]`, when testing future generation/scoring. Include invalid
  inputs and avoid tests that only duplicate implementation details.
- Run checks appropriate to the change and report results and gaps. For
  documentation/file moves, verify paths, unchanged source bytes, and JSON
  parsing; no application test framework is needed for initialization.
- From the repository root, validate JSON syntax with:

  ```sh
  python3 -m json.tool data/genji_poetry_exchanges_pilot.json > /dev/null
  ```

  Parsing alone establishes neither schema validity nor scholarly accuracy.
- Keep the root README's layout, status, and future build/test commands current.
  Preserve design rationale and trial findings when updating project context.
