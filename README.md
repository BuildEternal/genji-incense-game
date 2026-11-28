# Genji-kō Poetry Exchange

A small browser game inspired by **Genji-kō (源氏香)** and *The Tale of Genji*.
Read five waka sequentially, remember their imagery, then group poems from the
same documented poetic exchange (贈答歌). Matching uses `exchange_id`; shared
chapter, speaker, or imagery alone does not establish a match.

## Play the proof of concept

The easiest demo is the self-contained `dist/genji-poetry-demo.html`: download it
and open it in a modern browser. No installation or server is needed. The app,
styles, and unchanged pilot data are embedded; source links need internet access.

To develop locally, install the current **Node.js 24 LTS** release (24.15 or
newer) with npm. Node 22.22.2 or newer in the 22.x line is also supported.
From the repository root:

```sh
npm ci
npm run dev
```

On your own computer, open the Local URL printed by Vite. In the managed cloud
workspace, use `sites-preview start /workspace/genji-incense-game` instead of
starting a second server, then open its exact returned URL in the cloud browser.
Use Codex’s right-panel **New tab (+) → Desktop → Take over** to play there.
Cloud preview currently encounters a relay-readiness timeout; use the offline
demo until that infrastructure is available. Cloud loopback URLs do not point
to your computer. Previews may need restarting after the environment resumes;
`sites-preview stop` stops the managed preview.

1. The game opens on the **full collection** (795 waka), each shown as a provisional
   English gloss with the Japanese original beneath it (`data/genji_glosses.json`).
   Choose easy (reread while grouping), normal, or hard (same-chapter decoys), and
   optionally play an unscored practice round first.
2. A game is five rounds. Each round's shape comes from the real Genji-kō draw
   (25 packets, 5 drawn; `src/genjiko.ts`), so every pattern has its real odds.
   Read each poem and select **Next poem**. There is no timer or backtracking.
3. Colour the five poem buttons (right to left, like the diagram's lines); the Genji-kō
   diagram draws itself live. Sound is optional (off by default). Credits: `ASSETS.md`.
4. Only an exact pattern scores (玉). The reveal shows both patterns, which pairs you
   found (feedback only), the poems, links, notes, and source links. After five
   rounds a summary shows your 玉 count. Add `?pilot` for the 15-exchange pilot.

## Development and checks

```sh
npm test
npm run build
npm run preview
npm run demo
python3 -m json.tool data/genji_poetry_exchanges_pilot.json > /dev/null
```

Tests cover the pilot schema, invalid data, unique IDs, preserved Japanese,
seeded generation, the documented fixture, equivalent group labels, chapter-46
exchange separation, and the complete player flow in a simulated DOM.
The build checks TypeScript and emits static files into `dist/`; preview serves
that build locally. `npm run demo` builds and packages the standalone HTML file.
JSON parsing alone does not verify schema or literary accuracy.

## Repository structure

```text
.
├── AGENTS.md                           # Development and editorial guidelines
├── README.md
├── data/
│   ├── genji_poetry_exchanges_pilot.json  # 15-exchange pilot the prototype plays
│   ├── genji_poetry_exchanges_README.md
│   ├── genji_poems_v2.jsonl            # All 795 waka (text, speaker, sources)
│   ├── genji_buckets.json              # 428 buckets with links and hooks
│   ├── genji_buckets_README.md         # How buckets, links, and hooks work
│   └── archive/                        # v2 exchange notes and the link review

├── docs/PROJECT_CONTEXT.md             # Design rationale, trials, decisions
├── src/
│   ├── game.ts                         # Schema, seeded rounds, partition scoring
│   ├── app.ts                          # Read → group → reveal interface
│   ├── buckets.ts                      # Linked-bucket schema and checks
│   ├── linkedRound.ts                  # Round generator for the full database
│   ├── normalize.ts                    # Kana normalization for the echo check
│   ├── main.ts                         # Validate the pilot and start the app
│   └── style.css
├── tests/                              # Vitest logic and interface checks
├── scripts/make-demo.mjs               # Package a self-contained offline demo
├── scripts/build_buckets.py            # One-time v2 → linked-bucket migration
├── index.html
├── package.json
├── package-lock.json
└── tsconfig.json
```

Read the [project context](docs/PROJECT_CONTEXT.md), then the
[database documentation](data/genji_poetry_exchanges_README.md) and
[pilot JSON](data/genji_poetry_exchanges_pilot.json). Historical references to
original filenames describe the earlier handoff; the paths above are current.

## Current status and limits

The proof of concept uses **TypeScript, Vite, Zod, and Vitest** with plain HTML/CSS.
The full collection (`data/genji_buckets.json`, 428 buckets, 366 links) is the
default game, built by `src/linkedRound.ts` under the round rules in
`data/genji_buckets_README.md`. The curated pilot contains **15 exchanges, 30 waka,
and 14 chapters**, remains unchanged, and plays at `?pilot`. In the pilot, Each round has two complete exchanges and one singleton (`2+2+1`).
Generator v1 uses a seed to select distinct exchanges and shuffle five unique
poems. Scoring accepts equivalent labelings and reports exact grouping, matching
pairs found, and incorrect connections. Seeding is reproducible for the same
generator version and dataset ordering; it is not a difficulty setting.

This prototype tests the interaction and demo workflow. It has **no calibrated
difficulty filters**, cross-round reuse rules, player telemetry, persistence,
backend, or public hosting. Seeded selection may produce ambiguous or uneven
rounds; do not use outcomes as a validated measure of player skill. Reloading
starts over. Data is bundled in this client-side app; hiding metadata during
play is a presentation rule, not protection against inspection.

English glosses are **provisional interpretations**, and difficulty labels remain
hypotheses. Classical Japanese review, comparison with a critical edition,
precise source anchors, publication permissions/attribution review, and gameplay
calibration remain outstanding. `cross_checked` does not imply full scholarly
approval. No external translations or new poems have been added.
