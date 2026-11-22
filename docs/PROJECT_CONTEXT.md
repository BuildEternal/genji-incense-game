# PROJECT_CONTEXT.md — Genji-kō Poetry Exchange Game

**Project owner:** Aaron Epshteyn (Boston University; Computer Science, Linguistics, and Japanese)  
**Origin:** Creative final project for a course on *The Tale of Genji*, Fall 2026  
**Document updated:** 2026-11-22<br>
**Current stage:** Local proof of concept implemented; 15-exchange pilot retained unchanged; interaction and demo workflow ready for testing.<br>
**Audience:** A new Codex conversation or developer who cannot see the original brainstorming and trial conversations.

> **Instructions for the next developer:** Read this file first, then `genji_poetry_exchanges_README.md` and `genji_poetry_exchanges_pilot.json`. Respect the distinctions between **[DECIDED]**, **[WORKING BASELINE]**, **[TENTATIVE]**, **[DEFERRED]**, and **[OPEN]** below. The owner wants to preserve the literary/game-design reasoning, not merely assemble a generic poem-matching app.

### Implementation follow-up — 22 November 2026

The owner approved TypeScript + Vite with plain HTML/CSS and Vitest. Game
language is English; original Japanese may appear alongside it. Group assignments
are final only at submission. For this proof of concept, the agreed flow is to
read all five poems first, then assign and revise groups of numbered positions
without redisplaying their texts, and submit once for the reveal. Reading is
self-paced, without a timer. Japanese is optional during reading and always
included at reveal; English glosses retain their provisional label.

The local prototype includes schema validation, reproducible seeded `2+2+1`
rounds, label-invariant scoring, sequential presentation, and source-backed answer
reveals. Automated logic and interface tests accompany it. The immediate purpose
is to verify play and the demo workflow, not to establish balanced difficulty.
Statistical calibration, motif-interference filtering, persistence, and hosting
remain deferred. See `../README.md` for commands and current limits.

The original handoff below preserves the earlier rationale, experiments, and
proposals. Statements that programming has not begun, that the stack/language/
assignment timing is open, or that players must assign while reading describe
the earlier stage and are superseded by this follow-up. The database and its
editorial README now live in `../data/`; their curated content is unchanged.

## 1. Executive summary

The project is a small digital reinterpretation of **Genji-kō (源氏香)**, the incense-listening game encountered in a class workshop. Physical Genji-kō has players determine which of five samples are the same scent. A computer cannot transmit smells, so the project's central challenge is to **group five literary stimuli that belong together, even when the relationships are subtle**, while keeping a meaningful and demonstrable connection to *The Tale of Genji*.

The preferred design is **Genji-kō Poetry Exchange**: show players five waka drawn from the novel; poems from the **same historically documented poetic exchange (贈答歌)** are in the same group. A typical exchange has an initiating verse and a responding verse that repeat, transform, or dispute imagery. Some poems in a round do not have a matching partner and are legitimate singletons. Presentation should be sequential, with earlier poems unavailable for reinspection, so recognizing themes and remembering prior imagery both matter.

Three informal trials revealed a key design choice: grouping arbitrarily chosen poems **by chapter** was effectively guessing, whereas grouping **actual poetic exchanges** was meaningfully inferable and enjoyable. Aaron explicitly enjoys a moderate-to-high level of difficulty when it arises from poetic analysis and memory rather than unknowable metadata. A 15-exchange pilot database (30 waka from 14 chapters) is already built as a JSON file with a detailed README.

**What is not done:** There is no running game, UI, round generator, scoring implementation, repository, calibrated difficulty model, or comprehensive curated corpus yet.

## 2. Origin and original concept

### Class and motivation

- The professor has accepted coding projects for final creative assignments in previous terms; Aaron wants to build a game for this class rather than a conventional paper.
- He particularly enjoyed the **Genji incense-game workshop** and wants to capture its distinctive reasoning: infer which stimuli belong together **without an obvious grouping rule at the surface level**.
- The *Genji* literary connection is a substantive requirement, not just a title or visual theme. Poems and their historical contexts should be authentic to the novel.
- As a CS/Japanese student, Aaron is comfortable with a data-driven implementation and appreciates both technical rigor and precise literary attribution.

### Initial ideas explored but not chosen

1. **Karuta-inspired matching** using poems from *Genji*. Interesting, but it risks feeling like a different game and not preserving the Genji-kō grouping mechanic.
2. **Identify a poem's season.** Potentially understandable, but a season quiz is not the central five-sample grouping experience and can be arbitrary for poems with layered seasonal language.
3. **Group five poems by chapter.** First concrete proposal: secretly select five *Genji* chapters at random; for each of five 'listening' turns, randomly select a chapter and show a random poem from it; players infer which poems came from the same chapter. This was the first tested mechanic, later set aside for the baseline because individual poems generally do not reveal their chapter reliably.

### Current core insight **[DECIDED]**

Group poems according to **documented exchanges**, not shared chapter, speaker identity, generalized mood, or merely similar words. The connection is real and can be explained: one poem responds to another through repeated expressions, a metaphor, a pun, or an argumentative reversal. Two different exchanges from **the same chapter must count as two separate groups**.

## 3. Target player experience and mechanics

| Aspect | Status | Explanation |
| --- | --- | --- |
| Five poem cards per round | **[DECIDED]** | Preserves the five-listening structure from the workshop. |
| Group poems from the same authentic exchange | **[DECIDED]** | `exchange_id`, not chapter ID, defines truth. |
| Sequential, one-at-a-time reveal | **[DECIDED / design intent]** | Aaron wants a memory component; earlier full poem text should not remain visible for easy comparison. |
| No previous-poem inspection while playing | **[DECIDED / design intent]** | This was Aaron's stated distinction between the simultaneous Round 2 trial and the actual game. |
| Player may start a new group for a poem | **[WORKING BASELINE]** | An unmatched poem is legitimate. Labels A, B, C, etc. simply denote equivalence classes. |
| 2+2+1 and 2+1+1+1 partitions | **[WORKING BASELINE]** | Supported by current two-poem exchange records; useful generator templates. |
| Hidden chapter/speaker/recipient/motif/source IDs | **[WORKING BASELINE]** | Disclosing them would leak answers. Show after scoring. |
| Reveal literary explanations after submission | **[DECIDED]** | Learning and fairness depend on showing *why* an exchange connects. |
| English text | **[WORKING BASELINE]** | Provisional in-house glosses are in the pilot; Japanese originals are retained. Exact language/display modes remain open. |
| Difficulty must be controlled statistically | **[DECIDED as a goal]** | Randomness cannot be completely uncontrolled. Specific thresholds/features are not yet fixed. |
| Traditional Genji-kō diagram presentation | **[TENTATIVE]** | Potentially elegant and culturally relevant; no UI specification or implementation yet. |
| A hard mode with broader motif clusters | **[DEFERRED]** | Only if explicitly separated from 'true historical exchange' grouping; it changes the ground-truth definition. |

### Example answer semantics

If the five displayed poems derive from exchanges X, Y, Z, Y, X, the correct partition is **positions 1 and 5 together, positions 2 and 4 together, and position 3 alone**. The canonical labels might be `A, B, C, B, A`, but **any equivalent relabeling is correct**. Never compare the literal label strings without first normalizing their group relationships.

### The central tension: subtlety vs. fairness

**Good difficulty:** A poem replies to another in a nontrivial way (same imagery transformed, wordplay, emotional argument), or the player must remember an earlier poem during sequential presentation.

**Bad difficulty:** The label is unknowable from the poem alone (chapter provenance without meaningful textual clues), translations erase the connection, a supposed pair is historically incorrect, or a singleton shares such similar surface language with a pair that the answer seems arbitrary.

Aaron is not requesting the easiest possible game. He **specifically enjoys analytical and memory difficulty**, provided the explanation reveals an intelligible relationship.

## 4. Informal trial history and what it established

Three manual five-poem trials were conducted in this project chat on **2026-11-21**. They were small, hand-constructed tests, **not standardized experiments**. The assignments, revealed groupings, and feedback below are preserved to inform UX and algorithm design. The identity of a few individual trial poems is not fully recoverable; do not guess it.

### Trial 1 — Chapter-based grouping

**Mechanic:** Five poems were drawn from selected chapters; the player had to guess which came from the same chapter, without being told those chapters.

**Aaron's submission:** `1=A; 2=B; 3=B; 4=A; 5=E`.  
**His one-word difficulty assessment:** **“guessing.”**

**Actual solution:**

| Position | Origin | Correct group |
| --- | --- | --- |
| 1 | *Suma*, chapter 12 (global waka ID 188) | A |
| 2 | *Akashi*, chapter 13 (global ID 228) | B |
| 3 | *Suma*, chapter 12 (global ID 200) | A |
| 4 | *Hashihime*, chapter 45 (global ID 626) | Singleton C |
| 5 | *Akashi*, chapter 13 (global ID 230) | B |

**Score given in the trial:** **0/2 actual matching pairs identified; 6/10 correct pairwise same/different judgments.** (There are ten unordered pairs of five positions.) A trivial 'all poems different' response would have scored **8/10** on that pairwise metric, a warning that raw pairwise accuracy can reward excessive splitting.

**Finding:** **Chapter grouping was not a fair default** because knowing a poem's chapter is not usually inferable from the brief translated text. The mechanic preserved hidden-group structure but not the evidence needed to reason about it. **[DECIDED] Do not use random chapter identity as the primary first-version answer key.**

### Trial 2 — Actual poetry-exchange matching, simultaneous display

**Mechanic:** All five poem texts were visible together; two pairs were genuine poetry exchanges; one poem was a distractor. The goal was to detect actual response relationships.

**Aaron's submission:** `1=A; 2=B; 3=C; 4=A; 5=B`.  
**Difficulty compared with Trial 1:** **“much_easier.”**

**Actual solution and source contexts:**

- **1 ↔ 4:** *Shiigamoto* (ch. 46), **Niou's deer/dew/mountain-village poem and the answer composed by Ōigimi for Naka no Kimi** (the pilot records this as `GK-014`, waka 638–639). Imagery changes from deer and dew to collective cries, mist, and tears.
- **2 ↔ 5:** *Shiigamoto* (ch. 46), **the Eighth Prince's wind/waves/separation poem and Niou's response on behalf of Kaoru's party** (`GK-013`, waka 632–633). The reply turns the river barrier into a wish for wind to pass between the shores.
- **3 alone:** a *Hashihime* (ch. 45) poem. Its precise trial poem ID should be reverified; the pilot's *Hashihime* pair (`GK-012`) is not proof that either particular member was the distractor.

**Score:** **2/2 matching pairs; 10/10 pairwise judgments** (perfect grouping).

**Aaron's elaboration:** Although he marked it much easier, **he still had to think about the shared connections** and found that enjoyable. He identified one important advantage in the trial: he could see all five poems simultaneously and compare them, unlike the envisioned final game. He later explicitly said **Trial 2 was more enjoyable** than Trial 1.

**Finding:** **[DECIDED] Genuine waka response relationships are substantially more promising** than opaque chapter provenance. However, because the poems were hand-selected and visible simultaneously, this one successful trial does not establish general difficulty or fairness under random selection.

### Trial 3 — Poetry-exchange matching, sequential presentation

**Mechanic:** Poems were presented one at a time, without an easy way to recheck previous text. This tested recall as well as thematic recognition. The round was intentionally more challenging, including a plausible distractor.

**Aaron's submission:** `1=A; 2=B; 3=A; 4=D; 5=A`.  
**Reported difficulty:** **“memory.”**

**Actual solution:** **positions 1 ↔ 5 together; positions 2 ↔ 4 together; position 3 alone.**

- **1 ↔ 5:** *Suma* (ch. 12), the **Gosechi dancer ↔ Genji** exchange based on the koto's sound, a boat's **towline**, hesitation, and the Suma waves (`GK-007`, waka 206–207).
- **2 ↔ 4:** *Agemaki* (ch. 47), the **Kaoru ↔ Ōigimi** exchange about tying a **long promise**, a decorative knot, and the fragility of a **string of tear-pearls** (`GK-015`, waka 653–654).
- **3 alone:** a **Genji poem from *Akashi*** with deliberately overlapping music/string/promise imagery. **The exact global ID is not securely preserved in this handoff.** Do not assume it is poem 229 or 230 merely because `GK-008` is the pilot's *Akashi* exchange; that pilot pair instead concerns dreams and waking. The trial's full card text must be recovered separately if an exact replay is desired.

**Score:** **1/2 true matching pairs; 7/10 pairwise judgments.** Aaron's `A` group correctly connected positions 1 and 5 but incorrectly absorbed singleton 3; he failed to join positions 2 and 4.

**Aaron's later feedback:** He **remembered the towline imagery** but struggled to retain the exact keywords and themes of other poems despite consciously trying to memorize them. Importantly, he said this was **fun**: identifying relationships from comparable images and themes remained enjoyable, and he was **not worried** about difficulty arising from memory and practice. He observed that actual incense games are difficult without practice too.

**Finding:** **[DECIDED] Preserve sequential presentation and its memory challenge.** But **[OPEN]** its isolated effect has not been measured: Trial 2 and Trial 3 changed not only visibility but also the poem set and distractor strength. A proper comparison should replay the *same poems* in simultaneous and sequential conditions, ideally with multiple players.

### Trial-score comparison

| Trial | Grouping basis | Display | Aaron's difficulty label | Matching pairs | Pairwise score | Interpretation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Same chapter | Simultaneous/manual test | Guessing | 0/2 | 6/10 | Fundamentally weak inference target |
| 2 | Same exchange | Simultaneous | Much easier | 2/2 | 10/10 | Inferable and enjoyable |
| 3 | Same exchange | Sequential | Memory | 1/2 | 7/10 | Harder but enjoyable; confounded comparison |

**Scoring caveat:** Literal letters do not matter, only which of the ten position-pairs the player judges as same/different. Report matched pairs separately from the ten-pair score and consider a partition-level exact-match score. Raw ten-pair accuracy favors splitting everything when most pairs are actually different.

## 5. The database-first decision

After Trial 3, Aaron expressed the main remaining concern: **what difficulty emerges from the algorithm that chooses poems**, not whether the occasional difficult round is unacceptable. He agreed that the most manageable first deliverable was to **curate and verify a limited exchange bank before building the game**.

The team elected to create a pilot of **15 genuine exchange pairs** with source documentation, rather than immediately extracting all of *Genji*'s poems or implementing a large generator. This stage is complete as of this handoff; editorial scrutiny remains necessary.

### Files created

1. **`genji_poetry_exchanges_pilot.json`** — Machine-readable pilot (`version: 0.1.0`), 15 `exchanges` containing two waka each. Stable `exchange_id`, chapter number/name, text and English gloss, original poem ID, sender/recipient, initiation/reply roles, context, response mechanism, motif tags, provisional difficulty, source URLs, and verification notes.
2. **`genji_poetry_exchanges_README.md`** — Editorial methods, source cautions, content coverage, an example developer test fixture, generator constraints, review requirements, and the intended Codex handoff.
3. **`PROJECT_CONTEXT.md`** — This standalone conversation/design/implementation handoff.

The two pilot files were saved as durable artifacts:

- [Pilot JSON](https://chatgpt.com/library?file_id=libfile_c2514c9d4c948191b83889336d13dbab&account_id=personal)
- [Pilot README](https://chatgpt.com/library?file_id=libfile_8f914f8e823c8191a0602437d5303cc1&account_id=personal)

**Migration instruction:** Download all three files into the new Git repository (preferably its root, or a clearly documented `data/` layout). Do not assume the next Codex chat can automatically see attachments or context from this project conversation.

### Pilot index (content actually present)

| Exchange ID | Chapter | Global waka IDs | Principal poetic connection | Hypothesized difficulty |
| --- | --- | --- | --- | --- |
| `GK-001` | 2 · *Hahakigi* | 10–11 | Fingers / counting grievances | Medium |
| `GK-002` | 3 · *Utsusemi* | 24–25 | Cicada / hidden tears | Easy |
| `GK-003` | 4 · *Yūgao* | 26–27 | Evening faces / uncertain recognition | Easy |
| `GK-004` | 5 · *Wakamurasaki* | 45–46 | Young grass / dew / mortality | Medium |
| `GK-005` | 9 · *Aoi* | 112–113 | Festival leaves / meeting-day pun | Hard |
| `GK-006` | 10 · *Sakaki* | 152–153 | Ritual cord / remembered time | Hard |
| `GK-007` | 12 · *Suma* | 206–207 | Towline / koto / hesitation | Medium |
| `GK-008` | 13 · *Akashi* | 229–230 | Dream / waking / conversation | Medium |
| `GK-009` | 14 · *Miotsukushi* | 248–249 | Parting / pretext | Medium |
| `GK-010` | 15 · *Yomogiu* | 269–270 | Wisteria / waiting | Hard |
| `GK-011` | 24 · *Kochō* | 364–365 | Butterflies / spring–autumn contest | Medium |
| `GK-012` | 45 · *Hashihime* | 628–629 | Uji river / wet sleeves | Medium |
| `GK-013` | 46 · *Shiigamoto* | 632–633 | Wind / waves / separation | Medium |
| `GK-014` | 46 · *Shiigamoto* | 638–639 | Deer / tears / mountain village | Medium |
| `GK-015` | 47 · *Agemaki* | 653–654 | Knot / promise / tear-pearls | Medium |

**Important:** `GK-013` and `GK-014` occur in **the same chapter** but are **different exchanges**. The actual grouping must use `exchange_id`.

### Verification and source policy

- **Japanese original text and global IDs:** [Kōi Genji Monogatari Text DB — waka index](https://kouigenjimonogatari.github.io/en/waka.html), a 795-poem index. The JSON preserves its historical/transcriptional orthography with `/` separating five verse units.
- **Attributions and context:** [Genji Monogatari no Sekai](https://genji-monogatari.net/html/) annotated chapter texts, with per-exchange URLs in the JSON; [Genji Poems](https://www.genjipoems.org/) is a useful independent poem-centered cross-reference associated with J. Keith Vincent (BU).
- **English:** Newly drafted **provisional** glosses for the game, **not** reproduced from modern published translations. Do not replace them with copyrighted translations without obtaining appropriate permission.
- **`verification.status: "cross_checked"`:** The pair relationship, Japanese text, and principal attribution were checked against digital sources. **It does not certify** complete textual-critical, professional translation, variant-reading, or gameplay fairness review.

Editorial examples: a poem in *Hahakigi* is spoken within a narrated anecdote; Utsusemi's response invokes older verse; one later reply is written on a sibling's behalf; wordplay such as **aoi/au hi**, **matsu** (pine / wait), and **sono kami** (god / long ago) is difficult to preserve in English. The first poem on Yūgao's fan is **sent by Yūgao to Genji**, not vice versa. See the README and each record's notes.

### Limits of the current bank

1. **Only 15 pairs, all of length exactly 2.** A standard five-card round can produce `2+2+1`, `2+1+1+1`, or five singletons, but cannot produce a three-of-a-kind or longer historically documented exchange from this bank. Do not fabricate third verses.
2. **No balanced difficulty calibration.** 'Easy/medium/hard' are editorial expectations, not experimentally determined. Repeated motifs across unrelated poems may complicate otherwise fair rounds.
3. **Selection bias.** Pairs were hand-picked for recognizable literary interest across 14 chapters, including the Uji chapters; this is not a representative random sample of all 795 waka.
4. **Translations are imperfect clue surfaces.** A literal or artistic translation may strengthen or erase relationships; validate with classical Japanese readers and playtesters.
5. **No explicit license/attribution audit for publication.** Recheck each website's terms and requirements before distributing original transcriptions or derivative UI assets; distinguish old public-domain Japanese text from modern editorial work.
6. **No precise source anchors or manuscript variants yet.** Per-exchange source URLs are supplied, but exact chapter/section anchors and a second critical edition should be added in a release-ready corpus.
7. **No precomputed round-quality features yet.** Tags and difficulty are preliminary, and there is no statistical evidence that the future generator will consistently produce interpretable challenges.
8. **Trial content and pilot data are not identical.** Do not assume any trial singleton is included in the bank or assign its ID from a superficially similar pilot entry.

## 6. Controlled-randomness design: priorities and open questions

Aaron's strongest forward-looking concern is the **algorithm choosing which poems appear together**. The goal is not uniform random sampling over all poem combinations. Use controlled randomness to obtain a *range of meaningful, fair difficulties*.

### Minimum baseline generator **[WORKING BASELINE]**

1. Load the pilot JSON and validate its schema and uniqueness.
2. Choose a partition template: start with **2+2+1**; optionally enable **2+1+1+1** once tested.
3. Choose the required number of **distinct** `exchange_id` values; pick both verses from each paired exchange, one verse from each singleton exchange. Do not repeat a `poem_id`.
4. Apply explicit quality filters or difficulty features *before* shuffling: thematic overlap among different exchanges, surface keyword similarity, pun/allusion dependencies, length of gloss, and whether the pair itself has clear textual continuity.
5. Shuffle card order using a **recorded seed**, then create correct group labels by first occurrence of each `exchange_id`.
6. Present cards sequentially, collect grouping decisions, normalize labels, and score the partition independent of arbitrary letter names.
7. At reveal, show originals, translations, speakers, chapter, actual initiation/reply order, response-mechanism explanation, and sources.
8. Log seed, selected IDs, presentation order, partition, difficulty features, guesses, response time, and any confidence/enjoyment rating so that difficulty can be tuned empirically.

**Developer fixture from README** (not one of Aaron's three historical trials): choose global waka IDs `[26, 206, 638, 207, 27]`. Correct labels by first occurrence are `[A, B, C, B, A]` (Yūgao pair, Suma pair, Shiigamoto singleton). Test that any consistent relabeling receives full credit.

### Specific algorithm issues to explore **[OPEN]**

- **Inter-exchange interference:** How much imagery may unrelated poems share before a singleton becomes misleading? A keyword like *tears*, *dew*, or *sleeves* occurs often in waka and cannot itself define a match.
- **Within-exchange link strength:** Exact repeated words vs. metaphorical inversion vs. allusive or pun-based response. Could have difficulty tags but need player data.
- **Card order:** Separation distance between matching poems (adjacent vs. 3 apart), and whether the reply may appear before the initiating poem. Historical order need not equal display order.
- **Memory vs. reasoning:** Trial 3 changed both display and content. Run the same round in sequential and simultaneous conditions to isolate effects.
- **Translation choices:** Japanese-only, English-only, bilingual, optional notes, or a short glossary; user has not selected a definitive mode.
- **Prior knowledge:** Should game introduce waka conventions, the characters, or seasonal allusions before play? What difficulty is appropriate for classmates who do not read classical Japanese?
- **Scoring:** Prefer exact partition, correct matching pairs, and pairwise same/different score as complementary signals; beware the latter's all-singletons baseline. Whether to use partial credit, time bonuses, or confidence remains undecided.
- **Learning/repetition:** Prevent immediate exchange reuse; possibly space repetition after incorrect answers, but balance practice and novelty.
- **Corpus growth:** More two-verse exchanges first, or three-plus-verse response chains when documentary evidence supports them. Do not silently change the grouping rule to generic 'same theme.'
- **Accessibility/UX:** Keyboard navigation, legible poem display, optional reread aid vs. strict memory mode, mobile layout, and culturally appropriate reveal diagram.

## 7. Confirmed decisions vs. provisional implementation choices

### Confirmed by Aaron's responses

- Build a **creative coding project** grounded in *The Tale of Genji* and modeled on Genji-kō, subject to his class rules.
- Preserve the **grouping of initially ambiguous stimuli** as the main intellectual action, not a standard classification quiz.
- Use **historically connected poetic exchanges** rather than opaque **chapter identity** as the principal first-version grouping target.
- Preserve **sequential exposure and memory** as intended challenges. The player should not be able to study all five side by side during the main play mode.
- Accept substantial difficulty when it derives from **real literary connections and recall**; ease is not the only criterion.
- Begin with a **small, curated, verified-as-far-as-possible database** rather than coding a huge, randomly filled poem bank.
- Move implementation into a **Codex-capable coding repository/conversation**, while this literary conversation remains useful for textual decisions and editorial review.

### Not yet confirmed / do not silently decide

- Programming language, web framework, styling system, hosting method, persistence, and repository name.
- Exact input interaction: commit a group label immediately as each poem appears, or allow some later reassignment without replaying full text.
- Whether original Japanese, English, romaji, a glossary, or bilingual display is default.
- Whether diagrams named after traditional Genji-kō chapter patterns are used, and their exact rendering.
- Difficulty scoring weights, automated synonym detection, penalty for ambiguous rounds, and target win rates.
- Number of rounds per game, replay policy, timer, hints, tutorial, sound/visual assets, and how many exchanges the final class deliverable needs.
- Whether poems should be shown with character names after a hint or only after final scoring.
- A particular source edition or translation style for publication.

## 8. Proposed next milestones for the Codex project

The previous assistant recommended that this handoff occur **now**: the project has concrete data artifacts and is ready for versioned software development. The following is a recommended implementation sequence, **not a fully negotiated specification**.

### Milestone 0 — Set up the working repository

- Put `PROJECT_CONTEXT.md`, `genji_poetry_exchanges_pilot.json`, and `genji_poetry_exchanges_README.md` under version control.
- Create a simple `README.md` for build/run commands once a stack is chosen; do not rewrite the literary rationale out of this file.
- Keep content edits traceable, with sources and translator/editor review notes.

### Milestone 1 — Data validation and deterministic generator

- Define a runtime schema/type for exchanges and poems.
- Validate 15 exchanges, 30 unique IDs, roles, 5-part Japanese texts, distinct exchange IDs, and every `source_urls` entry.
- Implement **seeded** `2+2+1` generation and canonical partition/score logic; optionally add `2+1+1+1`.
- Add automated tests with the developer fixture `[26,206,638,207,27]` and tests for swapped A/B/C labels, duplicate card rejection, and chapter-46 non-collision.
- Ensure no algorithm can expose the two members of an exchange as *different* ground-truth groups simply because they have different authors or poem numbers.

### Milestone 2 — Minimal playable sequential UI

- Display one poem and ask for a group (existing group or new group), following a clearly agreed interaction contract.
- Do not show prior **full texts** in normal mode. It may be useful to show labels already assigned, but whether players can edit them is an open design decision.
- Show progress (1/5 … 5/5), then an answer reveal with exact grouping, chapter, original text, English gloss, reply relationship, and explanatory notes.
- Start with a plain, functional prototype; artistic refinement comes later.

### Milestone 3 — Real difficulty assessment and controlled randomness

- Add player feedback (perceived difficulty, confidence, whether imagery or memory was decisive).
- Run the **same exact five poems** in sequential and side-by-side variants to isolate presentation effects.
- Compare outcomes of different distractor overlaps and separation distances.
- Tune selection constraints to prevent arbitrary or trivial rounds; document why an algorithm rejected/accepted each sampled combination.

### Milestone 4 — Editorial expansion and polish

- Verify and improve the English glosses, speaker roles, and text source anchors; solicit classical Japanese review where possible.
- Expand the curated bank only after the generator demonstrates useful play with 15 pairs.
- Add culturally informative visuals/Genji-kō patterns if feasible, plus class-appropriate contextual material.
- Prepare concise documentation explaining the traditional game, the literary adaptation, the algorithm, and the limits of the evidence for the final presentation.

### Minimal acceptance criteria for first playable build

- A clean install can launch the game locally.
- Every round has **exactly five unique poems**, with a provably correct partition based on `exchange_id`.
- A user can complete a round **sequentially** without consulting previously displayed poem bodies.
- Equivalent grouping labelings score identically.
- A reveal explains the actual documented exchange and links to its source.
- Generation can be reproduced by seed, and basic content-integrity tests pass.
- The prototype explicitly indicates that English translations are provisional until reviewed.

## 9. How to work with Aaron

Aaron evaluates explanations closely and often checks details against his own reading. Be rigorous about **who said what, to whom, in what chapter, and whether something is a direct reply or merely thematically similar**. An incorrect attribution is a game-data bug, not a minor cosmetic error. Explain assumptions and tradeoffs; do not quietly commit the project to an entire app stack or radically different mechanic simply because coding has started.

Keep the game fun and analytically challenging. Do not make it trivially easy by permanently highlighting matching keywords, showing both poem cards side-by-side in normal mode, or showing speaker/chapter metadata before scoring. Conversely, do not market arbitrary misleading noise as difficulty. When an experiment is ambiguous, label the uncertainty explicitly.

Finally, treat this markdown file as **living project documentation**. Update its decision table and open questions as Aaron approves choices, and keep the original brainstorming/trial findings intact as design rationale.

## 10. Suggested first prompt for the new Codex conversation

> We are building a small Genji-kō-inspired poetry matching game for my *Tale of Genji* class. Read `PROJECT_CONTEXT.md` in full first, followed by `genji_poetry_exchanges_README.md` and `genji_poetry_exchanges_pilot.json`. Please summarize the confirmed requirements, identify any blocking decisions needed for an MVP, and propose a minimal implementation plan. Prioritize a validated deterministic five-poem round generator, grouping-invariant scoring, and a sequential no-backtracking UI. Do not treat the pilot translations as final or choose a framework without considering the intended scope. After reviewing the files, let's implement the first playable version.
