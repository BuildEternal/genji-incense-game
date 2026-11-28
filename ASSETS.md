# Asset credits

Project rule (AGENTS.md): no AI-generated artistic assets. Every asset below was made by a
person, found online, and is used under its license. Visual elements (diagrams, smoke, slips,
seal, colours) are CSS and code-drawn SVG, not image files.

## Sounds (`src/assets/sounds/`)

Short clips were cut from the original recordings with ffmpeg: trimmed, faded, converted to
mono MP3, and level-adjusted. No other processing.

| File | Original | Author | License | Clip taken |
| --- | --- | --- | --- | --- |
| `click.mp3` | [Fischtrommel_Muyu.mp3](https://freesound.org/people/the_very_Real_Horst/sounds/205999/) | the_very_Real_Horst | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | one wood-block hit at 7.18 s |
| `paper.mp3` | [rustling paper.wav](https://freesound.org/s/181774/) | keweldog | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) | 1.0–1.9 s |
| `gyoku.mp3` | [Big Singing Bowl](https://freesound.org/s/116315/) | Garuda1982 | CC0 1.0 | 0.72–6.72 s |
| `begin.mp3` | [Tibetan_Singing_Bowls_Improv.wav](https://freesound.org/s/365416/) | RutgerMuller | CC0 1.0 | 1.38–5.38 s |
| `pluck1.mp3`, `pluck2.mp3`, `pluck3.mp3` | [Japan_Koto_My_Amateur_Improv_Session_2.wav](https://freesound.org/people/RutgerMuller/sounds/365215/) | RutgerMuller | CC0 1.0 | single notes at 178.80 s, 181.93 s, 13.02 s |

Credit for the CC BY sound: "Fischtrommel_Muyu.mp3" by the_very_Real_Horst
(https://freesound.org/s/205999/), licensed CC BY 4.0, trimmed and level-adjusted.

## Fonts (`src/assets/fonts/`)

Subsets made from the full fonts in the google/fonts repository. Both are under the SIL Open Font License 1.1; the license
texts sit next to the font files.

| File | Font | License |
| --- | --- | --- |
| `noto-serif-jp-500.woff2`, `noto-serif-jp-700.woff2` | [Noto Serif JP](https://github.com/notofonts/noto-cjk) by Google (subset to the characters the game uses, including the 〱 repeat mark; `scripts/subset_fonts.py`) | OFL 1.1 (`OFL-NotoSerifJP.txt`) |
| `newsreader.woff2`, `newsreader-italic.woff2` | [Newsreader](https://github.com/productiontype/Newsreader) by Production Type (Latin subset with macrons; `scripts/subset_fonts.py`) | OFL 1.1 (`OFL-Newsreader.txt`) |

## Images

None yet. Candidates (public domain, see the redesign proposal): Ogata Gekkō's *Genji gojūyon-jō*
(NDL Image Bank, credit required) and Hiroshige's 1852 *Fifty-four Chapters of the Tale of Genji*
(Art Institute of Chicago, CC0).
