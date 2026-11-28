import type { LinkedDatabase } from './buckets';
import { canonicalKey, PATTERNS, patternFor, patternKey, patternSvg, type GenjiPattern } from './genjiko';
import { correctLabels, generateLinkedRound, scoreLinkedRound, type LinkedCard } from './linkedRound';

// Full-collection game: a game of five rounds, played like Genji-kō.
// Each round's shape comes from the real draw (see genjiko.ts). Players answer with a
// Genji-kō pattern; a round scores only if the whole pattern is right (marked 玉, gyoku).
// English gloss first, Japanese original beneath; Japanese only if a poem has no gloss.

export type Mode = 'easy' | 'normal' | 'hard';
export const ROUNDS_PER_GAME = 5;
const MODE_TEXT: Record<Mode, string> = {
  easy: 'Easy: you may reread all five poems while you group them.',
  normal: 'Normal: each poem disappears once you move on.',
  hard: 'Hard: as normal, and unrelated poems from the same chapter may appear together.',
};
// Tutorial: a fixed round with a known answer (A B C B A, the pattern 真木柱). It follows the
// project's fixture [26, 206, 638, 207, 27] but swaps 638 for 483: 638 says "evening",
// which echoes the evening-face pair and would break the echo rule.
const TUTORIAL_IDS = [26, 206, 483, 207, 27];

const escape = (value: string | number) => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const groupLetters = ['A', 'B', 'C', 'D', 'E'];
const kindLabel = { single: 'Single poem', exchange: 'Poetic exchange', chorus: 'Poems from one gathering', solo: 'Private poems' } as const;

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

export function mountLinkedGame(root: HTMLElement, db: LinkedDatabase) {
  let phase: 'intro' | 'reading' | 'grouping' | 'results' | 'summary' = 'intro';
  let mode: Mode = 'normal';
  let seed = 'genji-game-1';
  let tutorial = false;
  let round = 0; // 0-based index within the game
  let cards: LinkedCard[] = [];
  let position = 0;
  let assignments = Array<string>(5).fill('');
  let history: RoundRecord[] = [];

  const japanese = (text: string) => `<p class="japanese" lang="ja">${text.split('/').map(escape).join('<br>')}</p>`;
  const GLOSS_LABEL = '<p class="gloss-label">Provisional English gloss · Japanese original below</p>';
  const poemText = (poem: LinkedCard['poem']) => {
    const gloss = db.glosses.get(poem.poem_id);
    return gloss ? `<blockquote>${escape(gloss.english)}</blockquote>${GLOSS_LABEL}${japanese(poem.japanese)}` : `<blockquote>${japanese(poem.japanese)}</blockquote>`;
  };
  const noteFor = (poem: LinkedCard['poem']) => {
    const note = db.glosses.get(poem.poem_id)?.note;
    return note ? `<p class="gloss-note"><strong>Note:</strong> ${escape(note)}</p>` : '';
  };
  const patternName = (p: GenjiPattern) => `<span lang="ja">${p.ja}</span> ${escape(p.romaji)} · ${escape(p.english)}`;
  const figure = (p: GenjiPattern, caption = '') => `<figure class="pattern">${patternSvg(p.groups, `${p.ja} ${p.romaji}`)}<figcaption>${caption}${patternName(p)}<span class="muted">Chapter ${p.chapter}</span></figcaption></figure>`;
  const roundLabel = () => tutorial ? 'Practice round' : `Round ${round + 1} of ${ROUNDS_PER_GAME}`;
  const tip = (text: string) => tutorial ? `<aside class="tutorial-tip"><strong>Practice</strong> ${text}</aside>` : '';
  const score = () => history.filter(record => record.exact).length;

  function render(focusHeading = true) {
    root.innerHTML = `
      <header class="masthead"><a class="brand" href="./" aria-label="Genji-kō home">源氏香 <span>GENJI-KŌ</span></a><span class="edition">${phase === 'intro' ? 'Full collection' : `${roundLabel()} · ${mode[0].toUpperCase()}${mode.slice(1)}`}</span></header>
      <main id="main" tabindex="-1">${content()}</main>
      <footer><span>A game of poetry, memory, and connection.</span><span>795 waka · <a href="?pilot">English pilot</a></span></footer>`;
    bind();
    if (focusHeading) root.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }

  function content(): string {
    if (phase === 'intro') return `
      <section class="intro">
        <p class="eyebrow">Inspired by The Tale of Genji</p>
        <h1 tabindex="-1">Five poems.<br><em>Which belong together?</em></h1>
        <p class="lead">In Genji-kō, guests smell five incenses and say which were the same, answering with one of 52 patterns named for the chapters of the Tale. Here the incense is poetry: five waka from the Tale, in English with the original Japanese.</p>
        <ol class="instructions">
          <li><strong>Read</strong><span>Five poems, one at a time. Poems that belong together share wording; some stand alone.</span></li>
          <li><strong>Remember</strong><span>Carry the images in memory as you go.</span></li>
          <li><strong>Answer</strong><span>Group the poems and name the Genji-kō pattern. Only a fully correct pattern scores: 玉.</span></li>
        </ol>
        <form id="start-form" class="start-panel">
          <fieldset class="modes"><legend>Difficulty</legend>${(['easy', 'normal', 'hard'] as Mode[]).map(m =>
            `<label class="check"><input type="radio" name="mode" value="${m}" ${m === mode ? 'checked' : ''}> ${escape(MODE_TEXT[m])}</label>`).join('')}</fieldset>
          <details class="demo-settings"><summary>Repeat a game</summary><label for="seed">Game seed</label><input id="seed" name="seed" maxlength="100" required value="${escape(seed)}"><p class="muted">The same seed and difficulty repeat the same five rounds.</p></details>
          <div class="start-buttons"><button id="start-button" class="primary" type="button">Begin a game of ${ROUNDS_PER_GAME} rounds</button><button id="tutorial-button" class="secondary" type="button">Practice round first</button></div>
        </form>
        <p class="prototype-note">Research prototype · English glosses, groupings, and hooks are provisional; difficulty has not been calibrated.</p>
      </section>`;

    if (phase === 'reading') return `
      <section class="reading">
        <div class="stage-label"><p class="eyebrow">${escape(roundLabel())} · Read & remember</p><span>Poem ${position + 1} of 5</span></div>
        <div class="progress" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<span class="${i <= position ? 'filled' : ''}"></span>`).join('')}</div>
        ${tip(position === 0 ? 'Read this poem and notice its images. In a real round you cannot go back, so keep a word or two in mind.' : position === 4 ? 'Last poem. Next you will group all five from memory.' : 'Does this poem share an image with one you have read? Some poems match nothing.')}
        <article class="poem-card">
          <h1 class="poem-number" tabindex="-1">Poem ${position + 1}</h1>
          ${poemText(cards[position].poem)}
        </article>
        <div class="reading-controls"><p class="muted">${mode === 'easy' ? 'Easy mode: you can reread every poem while grouping.' : 'Keep the wording in mind.<br>This text disappears when you continue.'}</p><button id="next" class="primary">${position === 4 ? 'Group the poems' : 'Next poem'}</button></div>
      </section>`;

    if (phase === 'grouping') return `
      <section class="answer">
        <p class="eyebrow">${escape(roundLabel())} · Connect</p>
        <h1 tabindex="-1">Which poems<br><em>belong together?</em></h1>
        ${tip('Poems 1 and 5 both speak of the evening-face flower; poems 2 and 4 both pull on a rope (a towline). Poem 3, the little cat, matches nothing. Give 1 and 5 one letter, 2 and 4 another, and 3 a third. The pattern is 真木柱, Makibashira; you can also find it on the chart.')}
        <p class="lead">Give matching poems the same letter, or pick the pattern on the chart. A poem on its own gets its own letter.</p>
        ${mode === 'easy' ? `<details class="reread" open><summary>Reread the poems</summary>${cards.map((card, i) => `<div class="reread-poem"><h3>Poem ${i + 1}</h3>${poemText(card.poem)}</div>`).join('')}</details>` : ''}
        <form id="answer-form">
          <fieldset><legend>Assign a group to each poem</legend>
            <div class="assignment-grid">${assignments.map((value, i) => `<label class="assignment" for="group-${i}"><span>Poem ${i + 1}</span><select id="group-${i}" name="group-${i}" required><option value="">Choose</option>${groupLetters.map(letter => `<option value="${letter}" ${value === letter ? 'selected' : ''}>Group ${letter}</option>`).join('')}</select></label>`).join('')}</div>
          </fieldset>
          <div class="pattern-preview" aria-live="polite" aria-atomic="true">${preview()}</div>
          <details class="pattern-chart"><summary>Choose from the Genji-kō chart (52 patterns)</summary><p class="muted">The first poem is the rightmost line. Joined lines are poems that belong together.</p><div class="chart-grid">${chart()}</div></details>
          <div class="reading-controls"><p class="muted">Change your answer freely before submitting.</p><button id="submit-answer" class="primary" type="button" ${assignments.some(value => !value) ? 'disabled' : ''}>Submit answer</button></div>
        </form>
      </section>`;

    if (phase === 'summary') return `
      <section class="results summary">
        <p class="eyebrow">The game is over</p>
        <h1 tabindex="-1">${score()} 玉 <em>of ${ROUNDS_PER_GAME}</em></h1>
        <p class="lead">${score() === ROUNDS_PER_GAME ? 'Every pattern named. A perfect evening.' : score() ? 'Each 玉 is a pattern named exactly.' : 'No 玉 this time. The patterns get easier to hear with practice.'}</p>
        <ol class="round-list">${history.map((record, i) => {
          const actual = patternFor(correctLabels(record.cards));
          return `<li class="${record.exact ? 'won' : ''}">${patternSvg(actual.groups)}<span><strong>Round ${i + 1}</strong> ${patternName(actual)}</span><span class="mark">${record.exact ? '玉' : '—'}</span></li>`;
        }).join('')}</ol>
        <div class="end-controls"><button class="primary" id="new-game">Play a new game</button><button class="secondary" id="replay-game">Replay this game</button></div>
        <p class="muted">Game seed: <code>${escape(seed)}</code> · ${escape(mode)}</p>
      </section>`;

    const result = scoreLinkedRound(cards, assignments);
    const actual = patternFor(result.correct);
    const answered = patternFor(result.submitted);
    const groupIndexes = [...new Set(cards.map(card => card.groupIndex))];
    const last = tutorial || round === ROUNDS_PER_GAME - 1;
    return `
      <section class="results">
        <p class="eyebrow">${escape(roundLabel())} · Revealed</p>
        <h1 tabindex="-1">${result.exact ? '玉 <em>The pattern is yours.</em>' : 'Not this time.'}</h1>
        ${tip(result.exact ? 'That is a 玉: the whole pattern right. In the real game only an exact answer counts.' : 'In the real game only an exact pattern scores. Below you can see which pairs you found and how each group is linked.')}
        <div class="comparison"><div><h2>Your answer</h2>${figure(answered)}</div><div><h2>The pattern</h2>${figure(actual)}</div></div>
        <p class="pair-feedback">${result.actualPairs ? `You found ${result.matchingPairsFound} of ${result.actualPairs} matching pair${result.actualPairs === 1 ? '' : 's'}` : 'No poems in this round belonged together'}${result.falseMatches ? `, and joined ${result.falseMatches} pair${result.falseMatches === 1 ? '' : 's'} that do not match` : ''}. <span class="muted">Feedback only; the score counts exact patterns.</span></p>
        <div class="exchange-list">${groupIndexes.map(groupIndex => {
          const selected = cards.flatMap((card, index) => card.groupIndex === groupIndex ? [{ card, index }] : []);
          const { bucket, hooks } = selected[0].card;
          const first = selected[0].card.poem;
          return `<article class="exchange">
            <p class="eyebrow">${selected.length === 1 ? 'Singleton' : escape(kindLabel[bucket.kind])} · Poem${selected.length === 1 ? '' : 's'} ${selected.map(item => item.index + 1).join(' & ')}</p>
            <h2>${escape(first.chapter_title_ja)} <span>· Chapter ${first.chapter_number}</span></h2>
            <p>${escape(bucket.context)}</p>
            ${hooks.length ? `<h3>Shared wording</h3><p class="hook" lang="ja">${hooks.map(escape).join(' ／ ')}</p>` : '<p class="singleton-note">No other poem in this round belongs with this one.</p>'}
            <div class="revealed-poems">${selected.map(({ card, index }) => `<div class="revealed-poem"><h3>Poem ${index + 1}</h3>${poemText(card.poem)}${noteFor(card.poem)}<p class="attribution">${escape(card.poem.speaker)}</p><p class="muted"><a href="${escape(card.poem.original_page_url)}" target="_blank" rel="noopener noreferrer">Source text</a> · Poem ${card.poem.poem_id} · ${escape(bucket.bucket_id)}</p></div>`).join('')}</div>
          </article>`;
        }).join('')}</div>
        <div class="end-controls">${tutorial
          ? '<button class="primary" id="start-after-tutorial">Begin the real game</button>'
          : `<button class="primary" id="next-round">${last ? 'See the final score' : 'Next round'}</button>`}</div>
        ${tutorial ? '' : `<p class="muted">Score so far: ${score()} 玉 · Round seed: <code>${escape(roundSeed(round))}</code></p>`}
      </section>`;
  }

  function preview() {
    if (assignments.some(value => !value)) {
      const left = assignments.filter(value => !value).length;
      return `<p class="muted">${left} poem${left === 1 ? '' : 's'} still to assign. The pattern appears when all five have a letter.</p>`;
    }
    return `<h2>Your pattern</h2>${figure(patternFor(assignments))}`;
  }

  function chart() {
    const current = assignments.every(Boolean) ? canonicalKey(assignments) : '';
    return PATTERNS.map(p => {
      const key = patternKey(p);
      return `<button type="button" class="chart-cell${key === current ? ' selected' : ''}" data-key="${key}" aria-pressed="${key === current}">${patternSvg(p.groups)}<span lang="ja">${p.ja}</span><span class="romaji">${escape(p.romaji)}</span></button>`;
    }).join('');
  }

  const roundSeed = (index: number) => `${seed}#${index + 1}`;

  function startRound() {
    cards = tutorial ? tutorialCards(db) : generateLinkedRound(db, roundSeed(round), { sameChapterRule: mode !== 'hard' });
    assignments = Array<string>(5).fill('');
    position = 0;
    phase = 'reading';
    render();
    window.scrollTo?.(0, 0);
  }

  function startGame() {
    tutorial = false;
    round = 0;
    history = [];
    startRound();
  }

  function readSettings() {
    seed = root.querySelector<HTMLInputElement>('#seed')!.value.trim() || 'genji-game-1';
    mode = (root.querySelector<HTMLInputElement>('input[name="mode"]:checked')?.value as Mode) ?? 'normal';
  }

  function syncAnswer() {
    root.querySelectorAll<HTMLSelectElement>('.assignment select').forEach((select, i) => { select.value = assignments[i]; });
    root.querySelector('.pattern-preview')!.innerHTML = preview();
    const current = assignments.every(Boolean) ? canonicalKey(assignments) : '';
    root.querySelectorAll<HTMLButtonElement>('.chart-cell').forEach(cell => {
      cell.classList.toggle('selected', cell.dataset.key === current);
      cell.setAttribute('aria-pressed', String(cell.dataset.key === current));
    });
    root.querySelector<HTMLButtonElement>('#submit-answer')!.disabled = assignments.some(value => !value);
  }

  function bind() {
    // Buttons are type="button" with click handlers: sandboxed previews without allow-forms block form submission.
    root.querySelector('#start-button')?.addEventListener('click', () => { readSettings(); startGame(); });
    root.querySelector('#tutorial-button')?.addEventListener('click', () => { readSettings(); tutorial = true; startRound(); });
    root.querySelector('#start-form')?.addEventListener('submit', event => { event.preventDefault(); readSettings(); startGame(); });
    root.querySelector('#next')?.addEventListener('click', () => {
      if (position < 4) position++;
      else phase = 'grouping';
      render();
      window.scrollTo?.(0, 0);
    });
    root.querySelectorAll<HTMLSelectElement>('.assignment select').forEach((select, index) => {
      select.addEventListener('change', () => { assignments[index] = select.value; syncAnswer(); });
    });
    root.querySelectorAll<HTMLButtonElement>('.chart-cell').forEach(cell => {
      cell.addEventListener('click', () => { assignments = [...cell.dataset.key!]; syncAnswer(); });
    });
    const submitAnswer = () => {
      if (assignments.some(value => !value)) return;
      if (!tutorial) history.push({ cards, assignments: [...assignments], exact: scoreLinkedRound(cards, assignments).exact });
      phase = 'results';
      render();
      window.scrollTo?.(0, 0);
    };
    root.querySelector('#submit-answer')?.addEventListener('click', submitAnswer);
    root.querySelector('#answer-form')?.addEventListener('submit', event => { event.preventDefault(); submitAnswer(); });
    root.querySelector('#start-after-tutorial')?.addEventListener('click', startGame);
    root.querySelector('#next-round')?.addEventListener('click', () => {
      if (round < ROUNDS_PER_GAME - 1) { round++; startRound(); return; }
      phase = 'summary';
      render();
      window.scrollTo?.(0, 0);
    });
    root.querySelector('#replay-game')?.addEventListener('click', startGame);
    root.querySelector('#new-game')?.addEventListener('click', () => {
      seed = `genji-${crypto.randomUUID()}`;
      phase = 'intro';
      render();
      window.scrollTo?.(0, 0);
    });
  }

  render(false);
}
