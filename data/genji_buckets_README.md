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
3. Echo check: if a poem repeats a hook word of a group shown in the round, it is never shown alongside that group.
4. Same chapter: never in the same round unless they are a linked group. This applies in normal mode only; hard mode drops it.
5. Otherwise: free.

Rule 3 applies to every hook of every group actually shown, including common words such as 月 in a moon-viewing chorus. A pair that is not linked is never shown, so it never triggers the check.

## Fields

| Field | Meaning |
| --- | --- |
| `bucket_id` | Stable ID from v2 (`CH13-06b` is new, from a split) |
| `kind` | `single`, `exchange` (sent/answered), `chorus` (several voices, one occasion), `solo` (one person's private poems) |
| `poem_ids` | Poems in the bucket, in narrative order |
| `context` | One line on what happens in the story |
| `links` | `{poems: [a, b], hook}` pairs that may be shown together |
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
