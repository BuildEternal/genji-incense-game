# Genji-kō Poetry Exchange Pilot — Editorial & Game Notes

**Version:** 0.1.0 (21 November 2026)  
**Companion data:** `genji_poetry_exchanges_pilot.json`  
**Status:** First research pilot; usable for prototype experiments, **not yet a publication-ready edition or a calibrated assessment**.

## What is in the dataset?

The JSON contains **15 direct poetic exchanges / 30 individual waka** from **14 chapters** of *The Tale of Genji*. Each exchange has:

- A stable ID (`GK-001` through `GK-015`) and chapter metadata.
- Two poem records with the **global poem numbers** from the [Kōi Genji Monogatari Text DB's waka index](https://kouigenjimonogatari.github.io/en/waka.html), the Japanese transcription, and an **original, provisional English game gloss**.
- Sender/recipient and whether the poem initiates or answers the exchange; in two later exchanges, the reply is composed **on another character's behalf**.
- Literary situation, how the response reworks the earlier poem, shared motif tags, and provisional difficulty.
- Source URLs and a verification object with evidence notes and any editorial cautions.

The data is deliberately structured around **poetic exchanges**, not chapters. For example, `GK-013` and `GK-014` both occur in chapter 46, *Shiigamoto*, but constitute different groups. The grouping key is `exchange_id`.

## Source and editorial approach

1. **Japanese poem text and numbering:** [Kōi Genji Monogatari Text DB — 795 waka](https://kouigenjimonogatari.github.io/en/waka.html). Its transcription is in historical spelling; it is not modernized, and the five segments are separated in the JSON by `/`. Do not silently normalize the Japanese without retaining the original field.
2. **Speaker and narrative context:** The chapter prose and explanatory notes at [Genji Monogatari no Sekai](https://genji-monogatari.net/html/) (including the [historical-text notes](https://www.genji-monogatari.net/src/original/note02.html)); each exchange supplies a chapter-specific URL. These scholarly annotations commonly distinguish *贈歌* (sent poem) from *返歌* (reply).
3. **Further digital cross-reference:** [Genji Poems](https://www.genjipoems.org/), a poem-centered project associated with J. Keith Vincent at Boston University, is a valuable next stop for checking poetic actors, literary context, and variation. **Do not copy its English translations into game content without permission.**
4. **English text:** These glosses were composed for this pilot, not copied from a published literary translation. They prioritize the clue-bearing image over elegance. They are **working interpretations**, not critical translations. Ambiguous terms and allusions need a Japanese-literature review.

`verification.status: "cross_checked"` means the poem text, relation of first poem and reply, and principal attribution have been checked against the index and contextual documentation. It **does not** mean a professional scholar has signed off on the translation, exact narrative framing, or all variant readings. The pilot has not been verified against a printed critical edition line by line.

### Source-specific editorial cautions

| Exchange | Editorial issue worth remembering |
| --- | --- |
| GK-001, *Hahakigi* | Both poems occur within a character's narrated anecdote, not a real-time exchange with Genji. |
| GK-002, *Utsusemi* | Genji's poem is sent via the discarded robe; Utsusemi's appended answer draws on an older poem. |
| GK-005, *Aoi* | The answer depends on an **aoi / au hi** (ritual hollyhock / meeting day) pun. |
| GK-006, *Sakaki* | The **sono kami** (god / former times) and ritual cord allusions are difficult to preserve in English. |
| GK-009, *Miotsukushi* | The addressee is an unnamed daughter of a woman called **Senji** (宣旨), not a securely named character. |
| GK-010, *Yomogiu* | The **matsu** (pine / waiting) pun helps explain the reunion. |
| GK-011, *Kochō* | The reply's *kochō* may suggest “come here”; *yamabuki* is Japanese kerria. |
| GK-013–014, *Shiigamoto* | A character writes a reply on another's behalf; do not confuse physical writer and intended recipient. |

The pilot intentionally includes prominent keywords (dew, butterfly, towline, knot) **and** exchanges where the relation depends more on a shared metaphor or wordplay than an exact English repetition.

## Coverage summary

| ID | Chapter | Poem IDs | Dominant connection | Proposed difficulty |
| --- | --- | --- | --- | --- |
| GK-001 | 2 · Hahakigi | 10–11 | Fingers / counting grievances | Medium |
| GK-002 | 3 · Utsusemi | 24–25 | Cicada / hiding / tears | Easy |
| GK-003 | 4 · Yūgao | 26–27 | Evening faces / uncertain recognition | Easy |
| GK-004 | 5 · Wakamurasaki | 45–46 | Young grass / dew / mortality | Medium |
| GK-005 | 9 · Aoi | 112–113 | Aoi leaves / meeting-day pun | Hard |
| GK-006 | 10 · Sakaki | 152–153 | Ritual cords / old times | Hard |
| GK-007 | 12 · Suma | 206–207 | Towline / hesitation / waves | Medium |
| GK-008 | 13 · Akashi | 229–230 | Dream / waking / uncertainty | Medium |
| GK-009 | 14 · Miotsukushi | 248–249 | Parting / pretext | Medium |
| GK-010 | 15 · Yomogiu | 269–270 | Wisteria / waiting | Hard |
| GK-011 | 24 · Kochō | 364–365 | Butterfly / seasonal contest | Medium |
| GK-012 | 45 · Hashihime | 628–629 | Uji water / pole / sleeves | Medium |
| GK-013 | 46 · Shiigamoto | 632–633 | Wind / waves / distance | Medium |
| GK-014 | 46 · Shiigamoto | 638–639 | Deer / village / tears | Medium |
| GK-015 | 47 · Agemaki | 653–654 | Knots / promises / tear pearls | Medium |

These difficulty ratings are **hypotheses**, not measured player performance. In particular, the order in which cards are displayed, the availability of a word glossary, and which other exchanges are drawn into a round all change difficulty dramatically.

## First playable design

The pilot supports two particularly useful **five-poem partitions**:

- **2+2+1:** Two distinct exchanges each provide both poems; a third contributes one distractor/solo group. This creates one solitary group rather than inventing a reply.
- **2+1+1+1:** One exchange provides both poems; three other exchanges each provide a singleton. This has more isolated poems and is likely harder to distinguish from random thematic overlap.

It cannot support patterns with **three or more poems from one group** because an exchange contains only two poems. If you want more intricate Genji-kō diagrams, you will need either **three-verse exchange chains** or a new grouping concept (linked image clusters) clearly labeled as distinct from a historical poetic exchange.

Example **test fixture** (revealed here for developers, not for presentation to a player):

| Display position | Poem ID | Exchange | Hidden true label |
| --- | --- | --- | --- |
| 1 | 26 | GK-003 | A |
| 2 | 206 | GK-007 | B |
| 3 | 638 | GK-014 | C |
| 4 | 207 | GK-007 | B |
| 5 | 27 | GK-003 | A |

Correct grouping: **1=5, 2=4, 3 alone**. Labels A/B/C are assigned by first appearance; the labels do not have inherent meaning and should never be part of the comparison algorithm.

### Minimum round-generator checks

1. Validate that every round contains exactly five **unique** `poem_id` values.
2. For the 2+2+1 mode, select **three distinct** `exchange_id` values and include both members of exactly two of them.
3. Shuffle the five cards, then compute canonical labels from first-seen exchange IDs.
4. Reject rounds where a selected singleton's poem repeats the *same strong English trigger phrase* as a two-member exchange unless deliberately tagged advanced/hard. For example, a generic theme like **tears** alone is not a reliable identifying clue.
5. Reveal source exchange IDs, chapter, senders, responses, and literary explanations **only after submission**.
6. Record player confidence, answer pattern, time to answer, and whether sequential presentation was used; use these results to calibrate difficulty later.

### Validation still needed before public release

- Review all 30 translations with a reader comfortable with classical Japanese; test alternate wordings with several players.
- Compare poem text to at least one critical printed edition, documenting variants; add precise chapter-section/line or stable TEI anchors.
- Test the distinction between the actual reply exchange and *shared imagery that also happens in unrelated poems* (false positives).
- Evaluate whether offering a short **known word list** before the round improves fairness without trivializing the matching task.
- Set reuse rules (avoid showing the same exchange on consecutive rounds) and record deterministic random seeds for reproducible difficulty analysis.

## When to move to a Codex coding project

**Now is a sensible handoff point** after reviewing this data. Interpretive decisions (which poem counts as a reply, what to translate or gloss) still benefit from the literary project discussion. But the next phase—JSON validation, a seeded round generator, UI with one-at-a-time display, tests, and difficulty instrumentation—belongs in a **Codex project/repository** with tracked files and runnable tests. Copy these two files into the new repository as initial fixtures and make the review notes into issues or TODOs. Do not treat this first pilot as a completed game content bank.
