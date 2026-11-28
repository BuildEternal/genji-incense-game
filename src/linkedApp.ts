import type { LinkedDatabase } from './buckets';
import { PATTERNS, patternFor, patternKey, patternSvg, type GenjiPattern } from './genjiko';
import { correctLabels, generateLinkedRound, scoreLinkedRound, type LinkedCard } from './linkedRound';
import { play, setSoundEnabled, soundEnabled } from './sound';
import './immersive.css';

// Full-collection game: a game of five rounds, played like Genji-kō.
// Each round's shape comes from the real draw (see genjiko.ts). Players answer by colouring
// five buttons (right to left, like the diagram's lines); a round scores only if the whole
// pattern is right (marked 玉, gyoku). English gloss first, Japanese original beside it.
// Visuals are CSS and code-drawn SVG; sounds are found recordings (ASSETS.md).

export type Mode = 'easy' | 'normal' | 'hard';
export const ROUNDS_PER_GAME = 5;
const MODES: Record<Mode, { name: string; text: string }> = {
  easy: { name: 'Easy', text: 'Reopen any poem while you group them.' },
  normal: { name: 'Normal', text: 'Each poem is gone once you move on.' },
  hard: { name: 'Hard', text: 'As normal, with unrelated poems from the same chapter.' },
};
/** The five dye colours of the answer buttons, with a numeral mark so colour is never the only cue. */
export const DYES = [
  { id: 'ai', name: 'Indigo', mark: '一' },
  { id: 'beni', name: 'Safflower', mark: '二' },
  { id: 'kuchinashi', name: 'Gardenia', mark: '三' },
  { id: 'matsuba', name: 'Pine', mark: '四' },
  { id: 'fuji', name: 'Wisteria', mark: '五' },
] as const;
// Tutorial: a fixed round with a known answer (A B C B A, the pattern 真木柱). It follows the
// project's fixture [26, 206, 638, 207, 27] but swaps 638 for 483: 638 says "evening",
// which echoes the evening-face pair and would break the echo rule.
const TUTORIAL_IDS = [26, 206, 483, 207, 27];

const escape = (value: string | number) => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const kindLabel = { single: 'A single poem', exchange: 'A poetic exchange', chorus: 'Poems from one gathering', solo: 'Private poems' } as const;
const RIGHT_TO_LEFT = [4, 3, 2, 1, 0]; // display order: poem 1 on the right

type RoundRecord = { cards: LinkedCard[]; assignments: string[]; exact: boolean };

export function tutorialCards(db: LinkedDatabase): LinkedCard[] {
  const groupOf = new Map<number, number>();
  return TUTORIAL_IDS.map(id => {
    const bucket = db.bucketOf.get(id)!;
    const shown = TUTORIAL_IDS.filter(other => db.bucketOf.get(other) === bucket);
    if (!groupOf.has(bucket.poem_ids[0])) groupOf.set(bucket.poem_ids[0], groupOf.size);
    const links = bucket.links.filter(link => link.poems.every(p => shown.includes(p)));
    return { poem: db.poems.get(id)!, bucket, groupIndex: groupOf.get(bucket.poem_ids[0])!, hooks: links.map(link => link.hook) };
  });
}

/** Groups of positions (1–5) from colour indexes; uncoloured positions stand alone. */
function groupsFrom(colours: readonly (number | null)[]): number[][] {
  const groups = new Map<string, number[]>();
  colours.forEach((colour, i) => {
    const key = colour === null ? `empty-${i}` : `c${colour}`;
    groups.set(key, [...(groups.get(key) ?? []), i + 1]);
  });
  return [...groups.values()];
}

/** A short, shareable seed such as "kiri-4f7k2q". */
export function randomSeed(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `genji-${[...bytes].map(b => 'abcdefghjkmnpqrstuvwxyz23456789'[b % 31]).join('')}`;
}

export function mountLinkedGame(root: HTMLElement, db: LinkedDatabase) {
  let phase: 'intro' | 'reading' | 'grouping' | 'results' | 'summary' = 'intro';
  let mode: Mode = 'normal';
  let typedSeed = ''; // what the player entered; blank means a fresh random game
  let seed = '';
  let tutorial = false;
  let round = 0;
  let cards: LinkedCard[] = [];
  let position = 0;
  let colours: (number | null)[] = Array(5).fill(null);
  let history: RoundRecord[] = [];
  let readingHeight = 0; // reserved height of the reading slip for this round (0 = not measured yet)
  let popup: number | null = null; // poem index shown in the reread popup (easy mode)

  root.classList.add('room');

  const assignments = () => colours.map(c => (c === null ? '' : String.fromCharCode(65 + c)));
  const complete = () => colours.every(c => c !== null);
  const score = () => history.filter(record => record.exact).length;
  const roundLabel = () => tutorial ? 'Practice' : phase === 'summary' ? 'Evening complete' : `Round ${round + 1} of ${ROUNDS_PER_GAME}`;
  const tip = (text: string) => tutorial ? `<aside class="tip"><span class="tip-mark">Practice</span> ${text}</aside>` : '';

  const japanese = (text: string) => `<p class="ja" lang="ja">${text.split('/').map(unit => `<span>${escape(unit)}</span>`).join('')}</p>`;
  const slip = (poem: LinkedCard['poem'], extra = '') => {
    const gloss = db.glosses.get(poem.poem_id);
    return `<div class="slip-body">${gloss ? `<div class="en"><blockquote>${escape(gloss.english)}</blockquote><p class="gloss-label">Provisional English gloss</p></div>` : ''}${japanese(poem.japanese)}</div>${extra}`;
  };
  const noteFor = (poem: LinkedCard['poem']) => {
    const note = db.glosses.get(poem.poem_id)?.note;
    return note ? `<p class="gloss-note"><strong>Note:</strong> ${escape(note)}</p>` : '';
  };
  const patternName = (p: GenjiPattern) => `<span class="pname"><span lang="ja">${p.ja}</span> <span class="romaji">${escape(p.romaji)}</span></span><span class="pgloss">${escape(p.english)} · Chapter ${p.chapter}</span>`;

  function render(focus = true) {
    root.innerHTML = `
      <header class="bar">
        <a class="brand" href="./" aria-label="Genji-kō home"><span lang="ja">源氏香</span><span class="brand-en">Genji-kō</span></a>
        <span class="where">${phase === 'intro' ? '' : `${escape(roundLabel())} · ${MODES[mode].name}${tutorial ? '' : ` · ${score()} 玉`}`}</span>
        <button id="sound-toggle" class="icon-button" type="button" aria-pressed="${soundEnabled()}" title="Sound">${soundEnabled() ? 'Sound on' : 'Sound off'}</button>
      </header>
      <main id="main" class="stage stage-${phase}" tabindex="-1">${content()}</main>
      ${popup !== null ? popupHtml(popup) : ''}
      <footer class="foot"><span>795 waka from the Tale of Genji · <a href="?pilot">English pilot</a></span><span>Sounds: found recordings, credited in ASSETS.md · No AI-generated art</span></footer>`;
    bind();
    if (phase === 'reading' && !readingHeight) measureReading();
    if (focus) root.querySelector<HTMLElement>(popup !== null ? '.popup' : 'h1')?.focus({ preventScroll: true });
  }

  function content(): string {
    if (phase === 'intro') return `
      <section class="title">
        <div class="smoke" aria-hidden="true"><span></span><span></span><span></span></div>
        <h1 tabindex="-1"><span class="title-ja" lang="ja">源氏香</span><span class="title-en">Genji-kō</span></h1>
        <p class="lead">In Genji-kō, guests smell five incenses and say which were the same, answering with one of fifty-two patterns named for the chapters of the Tale. Tonight the incense is poetry.</p>
        <ol class="steps">
          <li><strong>Listen</strong> Five poems arrive one by one. Poems that belong together share an image; some stand alone.</li>
          <li><strong>Remember</strong> Each poem is folded away once you move on.</li>
          <li><strong>Answer</strong> Colour the five poems into groups to form the pattern. Only an exact pattern earns a 玉.</li>
        </ol>
        <fieldset class="modes"><legend>Difficulty</legend>${(Object.keys(MODES) as Mode[]).map(m =>
          `<label class="mode${m === mode ? ' chosen' : ''}"><input type="radio" name="mode" value="${m}" ${m === mode ? 'checked' : ''}><strong>${MODES[m].name}</strong><span>${MODES[m].text}</span></label>`).join('')}</fieldset>
        <div class="actions"><button id="start-button" class="primary" type="button">Begin a game of ${ROUNDS_PER_GAME} rounds</button><button id="tutorial-button" class="secondary" type="button">Practice round first</button></div>
        <details class="seed"><summary>Repeat a game</summary><label for="seed">Game seed</label><input id="seed" maxlength="100" value="${escape(typedSeed)}" placeholder="Blank for a new game" autocomplete="off" spellcheck="false"><p>Leave it blank for a new game each time. Enter a seed from a record sheet, with the same difficulty, to replay those five rounds.</p></details>
        <p class="fine">Research prototype · English glosses, groupings, and hooks are provisional.</p>
      </section>`;

    if (phase === 'reading') return `
      <section class="reading">
        <h1 class="sr-only" tabindex="-1">Poem ${position + 1} of 5</h1>
        <div class="reading-body"${readingHeight ? ` style="min-height:${readingHeight}px"` : ''}>${readingSlip(position, true)}</div>
        ${tray()}
        <div class="actions"><button id="next" class="primary" type="button">${position === 4 ? 'Group the poems' : 'Next poem'}</button></div>
      </section>`;

    if (phase === 'grouping') {
      const groups = groupsFrom(colours);
      const empty = colours.flatMap((c, i) => (c === null ? [i + 1] : []));
      const pattern = complete() ? patternFor(assignments()) : null;
      return `
      <section class="grouping">
        <h1 tabindex="-1">Which poems <em>belong together?</em></h1>
        ${tip('Poems 1 and 5 both speak of the evening-face flower; poems 2 and 4 both pull on a rope. Poem 3, the little cat, matches nothing. Give 1 and 5 one colour, 2 and 4 another, and 3 a third: the pattern 真木柱, Makibashira.')}
        <p class="lead">Tap a poem to give it a colour; tap again for the next. Poems of one colour are one group. Right-click or long-press to step back.</p>
        <div class="answer-board">
          <div class="live-pattern" aria-live="polite">${patternSvg(groups, pattern ? `${pattern.ja} ${pattern.romaji}` : 'Your pattern so far', { wide: true, faint: empty })}<p class="live-name">${pattern ? patternName(pattern) : `<span class="pgloss">${empty.length} poem${empty.length === 1 ? '' : 's'} still to colour</span>`}</p></div>
          <div class="dye-row">${RIGHT_TO_LEFT.map(i => dyeButton(i)).join('')}</div>
          ${mode === 'easy' ? `<div class="reread-row">${RIGHT_TO_LEFT.map(i => `<button type="button" class="reread" data-poem="${i}">Reread ${i + 1}</button>`).join('')}</div>` : ''}
        </div>
        <div class="actions"><button id="submit-answer" class="primary" type="button" ${complete() ? '' : 'disabled'}>Submit</button></div>
      </section>`;
    }

    if (phase === 'summary') {
      const won = new Set(history.filter(r => r.exact).map(r => patternKey(patternFor(correctLabels(r.cards)))));
      const seen = new Set(history.map(r => patternKey(patternFor(correctLabels(r.cards)))));
      return `
      <section class="summary">
        <div class="record">
          <p class="record-head" lang="ja">香之記</p>
          <h1 tabindex="-1">${score()} 玉 <em>of ${ROUNDS_PER_GAME}</em></h1>
          <p class="lead">${score() === ROUNDS_PER_GAME ? 'Every pattern named. A perfect evening.' : score() ? 'Each 玉 is a pattern named exactly.' : 'No 玉 tonight. The patterns grow easier to hear with practice.'}</p>
          <ol class="record-rounds">${history.map((record, i) => {
            const actual = patternFor(correctLabels(record.cards));
            return `<li class="${record.exact ? 'won' : ''}"><span class="rno">${i + 1}</span>${patternSvg(actual.groups)}<span class="rname">${patternName(actual)}</span><span class="mark">${record.exact ? '<span class="seal small" lang="ja">玉</span>' : '—'}</span></li>`;
          }).join('')}</ol>
        </div>
        <details class="chart"><summary>The fifty-two patterns</summary><p class="fine">Gold: patterns that came up tonight. Sealed 玉: the ones you named exactly.</p><div class="chart-grid">${PATTERNS.map(p => {
          const key = patternKey(p);
          return `<div class="chart-cell${seen.has(key) ? ' seen' : ''}${won.has(key) ? ' won' : ''}">${patternSvg(p.groups)}<span lang="ja">${p.ja}</span><span class="romaji">${escape(p.romaji)}</span></div>`;
        }).join('')}</div></details>
        <div class="actions"><button class="primary" id="new-game" type="button">Play a new game</button><button class="secondary" id="replay-game" type="button">Replay this game</button></div>
        <p class="fine">Game seed: <code>${escape(seed)}</code> · ${MODES[mode].name}</p>
      </section>`;
    }

    // Results
    const result = scoreLinkedRound(cards, assignments());
    const actual = patternFor(result.correct);
    const answered = patternFor(result.submitted);
    const groupIndexes = [...new Set(cards.map(card => card.groupIndex))];
    const last = tutorial || round === ROUNDS_PER_GAME - 1;
    return `
      <section class="results ${result.exact ? 'exact' : 'miss'}">
        <h1 tabindex="-1">${result.exact ? 'The pattern is yours.' : 'Not this time.'}</h1>
        ${result.exact ? '<div class="seal stamp" lang="ja" role="img" aria-label="Gyoku: a perfect answer">玉</div>' : ''}
        ${tip(result.exact ? 'That is a 玉: the whole pattern right. In the real game only an exact answer counts.' : 'Only an exact pattern scores. Below you can see which pairs you found and how each group is linked.')}
        <div class="compare">
          <figure><figcaption>Your answer</figcaption>${patternSvg(answered.groups, `${answered.ja} ${answered.romaji}`, { wide: true, className: 'mine' })}<p>${patternName(answered)}</p></figure>
          ${result.exact ? '' : `<figure><figcaption>The incense was</figcaption>${patternSvg(actual.groups, `${actual.ja} ${actual.romaji}`, { wide: true, className: 'draw' })}<p>${patternName(actual)}</p></figure>`}
        </div>
        <p class="pairs">${result.actualPairs ? `You found ${result.matchingPairsFound} of ${result.actualPairs} matching pair${result.actualPairs === 1 ? '' : 's'}` : 'No poems in this round belonged together'}${result.falseMatches ? `, and joined ${result.falseMatches} pair${result.falseMatches === 1 ? '' : 's'} that do not match` : ''}. <span class="fine">Feedback only; the score counts exact patterns.</span></p>
        <div class="groups">${groupIndexes.map(groupIndex => {
          const selected = cards.flatMap((card, index) => card.groupIndex === groupIndex ? [{ card, index }] : []);
          const { bucket, hooks } = selected[0].card;
          const first = selected[0].card.poem;
          return `<article class="group-card">
            <p class="eyebrow">${selected.length === 1 ? 'On its own' : escape(kindLabel[bucket.kind])} · Poem${selected.length === 1 ? '' : 's'} ${selected.map(item => item.index + 1).join(' & ')}</p>
            <h2><span lang="ja">${escape(first.chapter_title_ja)}</span> <span class="fine">Chapter ${first.chapter_number}</span></h2>
            <p class="context">${escape(bucket.context)}</p>
            ${hooks.length ? `<p class="hook-line"><span>Shared wording</span> <span class="hook" lang="ja">${hooks.map(escape).join(' ／ ')}</span></p>` : '<p class="fine">No other poem in this round belongs with this one.</p>'}
            <div class="revealed">${selected.map(({ card, index }) => `<div class="slip small"><p class="slip-no">${index + 1}</p>${slip(card.poem, `${noteFor(card.poem)}<p class="attribution">${escape(card.poem.speaker)} · <a href="${escape(card.poem.original_page_url)}" target="_blank" rel="noopener noreferrer">Source text</a> · Poem ${card.poem.poem_id}</p>`)}</div>`).join('')}</div>
          </article>`;
        }).join('')}</div>
        <details class="chart"><summary>Find it on the chart of fifty-two patterns</summary><p class="fine">Gold: the incense. Dashed: your answer.</p><div class="chart-grid">${PATTERNS.map(p => {
          const key = patternKey(p);
          const cls = key === patternKey(actual) ? ' seen' : key === patternKey(answered) ? ' guess' : '';
          return `<div class="chart-cell${cls}">${patternSvg(p.groups)}<span lang="ja">${p.ja}</span><span class="romaji">${escape(p.romaji)}</span></div>`;
        }).join('')}</div></details>
        <div class="actions">${tutorial
          ? '<button class="primary" id="start-after-tutorial" type="button">Begin the real game</button>'
          : `<button class="primary" id="next-round" type="button">${last ? 'See the record of the evening' : 'Next round'}</button>`}</div>
        ${tutorial ? '' : `<p class="fine">Round seed: <code>${escape(roundSeed(round))}</code></p>`}
      </section>`;
  }

  function tray() {
    return `<ol class="tray" aria-label="Poems read">${RIGHT_TO_LEFT.map(i =>
      `<li class="${i < position ? 'done' : i === position ? 'now' : ''}"><span>${i + 1}</span></li>`).join('')}</ol>`;
  }

  function dyeButton(i: number) {
    const colour = colours[i];
    const dye = colour === null ? null : DYES[colour];
    const label = `Poem ${i + 1}: ${dye ? dye.name : 'no colour yet'}`;
    return `<div class="dye-slot"><button type="button" class="dye${dye ? ` dye-${dye.id}` : ' empty'}" data-poem="${i}" aria-label="${label}" title="${label}">${dye ? `<span lang="ja">${dye.mark}</span>` : ''}</button><span class="dye-no">${i + 1}</span></div>`;
  }

  // The tip and slip for one reading position. All five are measured off-screen at the start of
  // a round so the space below can be reserved for the tallest, keeping the controls still.
  function readingSlip(i: number, animate: boolean) {
    const tipText = i === 0 ? 'Read the poem and notice its images. In a real round it folds away for good when you continue.' : i === 4 ? 'Last poem. Next you colour all five from memory.' : 'Does this poem share an image with one you have read? Some poems match nothing.';
    return `${tip(tipText)}<article class="slip${animate ? ' unfold' : ''}"><p class="slip-no">${i + 1}</p>${slip(cards[i].poem)}</article>`;
  }

  function measureReading() {
    const body = root.querySelector<HTMLElement>('.reading-body');
    if (phase !== 'reading' || !body) return;
    const probe = document.createElement('div');
    probe.className = 'reading-body reading-probe';
    probe.setAttribute('aria-hidden', 'true');
    body.parentElement!.append(probe);
    let tallest = 0;
    for (let i = 0; i < cards.length; i++) {
      probe.innerHTML = readingSlip(i, false);
      tallest = Math.max(tallest, probe.getBoundingClientRect().height);
    }
    probe.remove();
    readingHeight = Math.ceil(tallest);
    if (readingHeight) body.style.minHeight = `${readingHeight}px`;
  }

  function popupHtml(i: number) {
    return `<div class="veil"></div><div class="popup slip" role="dialog" aria-modal="true" aria-label="Poem ${i + 1}" tabindex="-1"><p class="slip-no">${i + 1}</p>${slip(cards[i].poem)}<div class="actions"><button type="button" class="secondary" id="close-popup">Close</button></div></div>`;
  }

  const roundSeed = (index: number) => `${seed}#${index + 1}`;

  // Play a short exit animation on the matched elements, then continue. Skipped where motion
  // is reduced or unsupported, so the change is immediate there (and in tests).
  let leaving = false;
  function leave(selector: string, then: () => void) {
    const els = [...root.querySelectorAll<HTMLElement>(selector)];
    const motion = typeof window.matchMedia === 'function' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!motion || els.length === 0) { then(); return; }
    if (leaving) return;
    leaving = true;
    els.forEach(el => el.classList.add('leaving'));
    window.setTimeout(() => { leaving = false; then(); }, 220);
  }

  function go(next: typeof phase) {
    phase = next;
    popup = null;
    render();
    window.scrollTo?.(0, 0);
  }

  function startRound() {
    cards = tutorial ? tutorialCards(db) : generateLinkedRound(db, roundSeed(round), { sameChapterRule: mode !== 'hard' });
    colours = Array(5).fill(null);
    position = 0;
    readingHeight = 0;
    play('begin');
    go('reading');
  }

  function startGame() {
    tutorial = false;
    round = 0;
    history = [];
    startRound();
  }

  function readSettings() {
    typedSeed = root.querySelector<HTMLInputElement>('#seed')?.value.trim() ?? '';
    seed = typedSeed || randomSeed();
    mode = (root.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value as Mode) ?? 'normal';
  }

  function cycle(i: number, step: 1 | -1) {
    const current = colours[i];
    colours[i] = current === null ? (step === 1 ? 0 : DYES.length - 1) : (current + step + DYES.length) % DYES.length;
    const joined = colours.some((c, j) => j !== i && c === colours[i]);
    play(joined ? 'pluck' : 'click');
    render(false);
    root.querySelector<HTMLButtonElement>(`.dye[data-poem="${i}"]`)?.focus();
  }

  function bind() {
    root.querySelector('#sound-toggle')?.addEventListener('click', () => {
      setSoundEnabled(!soundEnabled());
      const button = root.querySelector<HTMLButtonElement>('#sound-toggle')!;
      button.textContent = soundEnabled() ? 'Sound on' : 'Sound off';
      button.setAttribute('aria-pressed', String(soundEnabled()));
      play('click');
    });
    root.querySelectorAll<HTMLInputElement>('input[name="mode"]').forEach(input => input.addEventListener('change', () => {
      root.querySelectorAll('.mode').forEach(label => label.classList.toggle('chosen', label.contains(input) && input.checked));
    }));
    root.querySelector('#start-button')?.addEventListener('click', () => { readSettings(); startGame(); });
    root.querySelector('#tutorial-button')?.addEventListener('click', () => { readSettings(); tutorial = true; startRound(); });
    root.querySelector('#next')?.addEventListener('click', () => {
      play('paper');
      leave('.stage-reading .slip', () => { if (position < 4) { position++; go('reading'); } else go('grouping'); });
    });
    root.querySelectorAll<HTMLButtonElement>('.dye').forEach(button => {
      const i = Number(button.dataset.poem);
      let longPress = false;
      let timer: number | undefined;
      button.addEventListener('click', () => { if (longPress) { longPress = false; return; } cycle(i, 1); });
      button.addEventListener('contextmenu', event => { event.preventDefault(); if (!longPress) cycle(i, -1); });
      button.addEventListener('touchstart', () => { timer = window.setTimeout(() => { longPress = true; cycle(i, -1); }, 550); }, { passive: true });
      button.addEventListener('touchend', () => clearTimeout(timer));
      button.addEventListener('keydown', event => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') { event.preventDefault(); cycle(i, event.key === 'ArrowUp' ? 1 : -1); }
      });
    });
    root.querySelectorAll<HTMLButtonElement>('.reread').forEach(button => button.addEventListener('click', () => {
      popup = Number(button.dataset.poem);
      play('paper');
      render();
    }));
    const closePopup = () => leave('.popup, .veil', () => {
      const last = popup;
      popup = null;
      render(false);
      root.querySelector<HTMLButtonElement>(`.reread[data-poem="${last}"]`)?.focus();
    });
    root.querySelector('#close-popup')?.addEventListener('click', closePopup);
    root.querySelector('.veil')?.addEventListener('click', closePopup);
    root.querySelector('.popup')?.addEventListener('keydown', event => { if ((event as KeyboardEvent).key === 'Escape') closePopup(); });
    root.querySelector('#submit-answer')?.addEventListener('click', () => {
      if (!complete()) return;
      const exact = scoreLinkedRound(cards, assignments()).exact;
      if (!tutorial) history.push({ cards, assignments: assignments(), exact });
      play(exact ? 'gyoku' : 'pluck');
      go('results');
    });
    root.querySelector('#start-after-tutorial')?.addEventListener('click', startGame);
    root.querySelector('#next-round')?.addEventListener('click', () => {
      if (round < ROUNDS_PER_GAME - 1) { round++; startRound(); return; }
      play('begin');
      go('summary');
    });
    root.querySelector('#replay-game')?.addEventListener('click', startGame);
    root.querySelector('#new-game')?.addEventListener('click', () => {
      typedSeed = '';
      go('intro');
    });
  }

  window.addEventListener('resize', () => { readingHeight = 0; measureReading(); });
  void document.fonts?.ready.then(() => { readingHeight = 0; measureReading(); });
  render(false);
}
