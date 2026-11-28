"""One-time migration: v2 exchange buckets + 2026-11-28 link review -> data/genji_buckets.json.

After this runs once, data/genji_buckets.json is the editable source of truth.
Re-running it overwrites manual edits, so only do so deliberately.

Usage (from repo root): python3 -I scripts/build_buckets.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
poems = {p["poem_id"]: p for p in map(json.loads, (ROOT / "data/genji_poems_v2.jsonl").read_text("utf-8").splitlines())}
exchanges = json.loads((ROOT / "data/archive/genji_exchanges_v2.json").read_text("utf-8"))["exchanges"]
review = json.loads((ROOT / "data/archive/link_review_2026-11-28.json").read_text("utf-8"))["pairs"]

# Membership changes agreed in the 2026-11-28 grouping review.
SPLITS = {"CH13-06": [
    ("CH13-06", [224, 225], "Genji sends a poem to the Akashi Lady; her father writes the reply on her behalf."),
    ("CH13-06b", [226, 227], "Genji asks to hear from the woman herself; she answers in her own verse."),
]}
MERGES = {  # kept id -> absorbed ids
    "CH32-02": ["CH32-03"],
    "CH46-07": ["CH46-10"],
}
EXTRA_LINKS = {"CH32-02": [([431, 435], "色も香もうつる/花の香をうつし")]}

def kind_of(ids):
    if len(ids) == 1:
        return "single"
    roles = [poems[i]["poem_role"] for i in ids]
    if any(("choral" in r) or ("successive_scene" in r) or (r == "scene_initiating_verse") for r in roles):
        return "chorus"
    solo = ("independent", "private", "retrospectively", "anticipated")
    if all(any(s in r for s in solo) for r in roles):
        return "solo"
    return "exchange"

by_id = {e["exchange_id"]: e for e in exchanges}
absorbed = {a: k for k, v in MERGES.items() for a in v}
buckets = []
for e in exchanges:
    eid = e["exchange_id"]
    if eid in absorbed:
        continue
    if eid in SPLITS:
        for new_id, ids, context in SPLITS[eid]:
            buckets.append({"bucket_id": new_id, "poem_ids": ids, "context": context, "split_from": eid})
        continue
    b = {"bucket_id": eid, "poem_ids": list(e["poem_ids"]), "context": e["context"]}
    if eid in MERGES:
        b["merged_from"] = [eid, *MERGES[eid]]
        for m in MERGES[eid]:
            b["poem_ids"] += by_id[m]["poem_ids"]
            b["context"] += " " + by_id[m]["context"]
    buckets.append(b)

bucket_of = {i: b["bucket_id"] for b in buckets for i in b["poem_ids"]}
for b in buckets:
    b["kind"] = kind_of(b["poem_ids"])
    b["links"] = []
for r in review:
    a, c = r["poems"]
    if bucket_of[a] != bucket_of[c]:
        continue  # pair separated by a split
    b = next(x for x in buckets if x["bucket_id"] == bucket_of[a])
    if r["suggestion"] == "link":
        b["links"].append({"poems": [a, c], "hook": r["hook"]})
for bid, extra in EXTRA_LINKS.items():
    b = next(x for x in buckets if x["bucket_id"] == bid)
    for ps, hook in extra:
        b["links"].append({"poems": ps, "hook": hook})
order = ["bucket_id", "kind", "poem_ids", "context", "links", "split_from", "merged_from"]
buckets = [{k: b[k] for k in order if k in b and (b[k] or k in ("links",))} for b in buckets]

out = {
    "dataset_id": "genji_linked_buckets",
    "version": "3.0.0",
    "poem_database": "genji_poems_v2.jsonl",
    "rules": {
        "bucket": "Poems that must never be shown as different groups in one round.",
        "links": "Pairs that may be shown together as a group; hook = the shared wording the reveal points to.",
    },
    "buckets": buckets,
}
(ROOT / "data/genji_buckets.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf-8")
print(len(buckets), "buckets")
