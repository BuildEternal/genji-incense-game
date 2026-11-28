# Linked buckets: how the full poem database decides groups

`genji_buckets.json` groups all 795 waka in `genji_poems_v2.jsonl` into 428
buckets. It replaces the v2 `exchanges` file (kept in `archive/` with its full
research notes) as the game-facing source of truth. Edit it directly from now
on. `scripts/build_buckets.py` was the one-time migration and overwrites edits
if re-run.

## The three ideas

- **Bucket:** poems that must never be shown as *different* groups in one
  round, because a skilled player could fairly put them together.
- **Link:** a pair of poems in a bucket that may be shown *together* as a group.
- **Hook:** the shared wording that justifies a link, in the original Japanese
  (for example `竹河・ふし`). It is also the reveal's one-line explanation, and the
  generator can use it to reject rounds where another poem repeats it.

Two poems in the same bucket without a link are never shown in the same round.
Either can still appear alone. A test for any pair: *can I point to a word they
share?* If yes, it is a link. If not, leave it unlinked.

## Round rules (for the generator)

For any two poems shown in one round:

1. Linked: they may be shown as one group.
2. Same bucket, not linked: never in the same round.
3. Echo check: if a poem repeats a hook word of a group shown in the round, it is never shown alongside that group. This is checked in Japanese (`hook`) and in English (`hook_en`).
4. Same chapter: never in the same round unless they are a linked group. This applies in normal mode only; hard mode drops it.
5. Otherwise: free.

Rule 3 applies to every hook of every group actually shown, including common words such as 月 in a moon-viewing chorus. A pair that is not linked is never shown, so it never triggers the check.

`src/linkedRound.ts` implements these rules for the templates 2+2+1, 2+1+1+1,
3+1+1 and 3+2. A 3-poem group needs at least two of its three pairs linked.
The echo check matches hook words against normalized kana. It errs on the strict
side: a short hook such as なみ also matches inside なみた, so some fair rounds
are rejected, but no unfair round gets through on that account.

## Fields

| Field | Meaning |
| --- | --- |
| `bucket_id` | Stable ID from v2 (`CH13-06b` is new, from a split) |
| `kind` | `single`, `exchange` (sent/answered), `chorus` (several voices, one occasion), `solo` (one person's private poems) |
| `poem_ids` | Poems in the bucket, in narrative order |
| `context` | One line on what happens in the story |
| `links` | `{poems: [a, b], hook, hook_en}` pairs that may be shown together; `hook_en` is the shared English wording |
| `split_from` / `merged_from` | Membership changes from the v2 buckets |

## Changes from v2 (2026-11-28 review)

- Split CH13-06 into CH13-06 [224, 225] and CH13-06b [226, 227]: distinct hooks.
- Merged CH46-10 into CH46-07: snow and the absent father recur across both pairs.
- Merged CH32-03 into CH32-02, adding link 431–435 (色も香もうつる / 花の香をうつし).

## Review status

Links and hooks were drafted pair by pair by Claude on 2026-11-28 from the
Japanese text (`archive/link_review_2026-11-28.json`). They are suggestions
pending the owner's review. Pairs judged weak or without a hook were left unlinked;
their suggested hooks remain in the review file if a pair is ever promoted. Hooks have not yet
been checked against English glosses: a link is only fair in English if the
gloss renders the hook with the same word in both poems.

## English glosses (`genji_glosses.json`)

- One provisional English gloss per poem (795), keyed by `poem_id`, with an optional
  `note` explaining a pun or allusion English cannot carry. Notes are shown only
  after the answer, so they never act as hints.
- Glosses for the 30 pilot poems are copied verbatim from the pilot file.
- Where two linked poems share a hook, both glosses try to use the same English
  word for it, so an English reader can hear the echo. A word-overlap check over
  all links was run on 2026-11-28; the pilot pairs were left as written.
- **English echo check:** each link also has `hook_en`, the content words both
  linked glosses share (filled by `scripts/derive_hook_en.py`, using
  `scripts/english_stopwords.txt` and a light plural strip; three links were set by
  hand). When glosses are loaded, rule 3 also checks that no poem outside a group
  uses one of that group's `hook_en` words in its English. Re-running the script
  only fills links that have no `hook_en` yet, so hand edits are kept. If you edit
  a gloss, delete that link's `hook_en` and re-run.
- Not reviewed by a specialist. Corrections are welcome and need only an edit to
  this file.
