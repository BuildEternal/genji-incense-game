import type { LinkedDatabase } from './buckets';
import { generateLinkedRound, scoreLinkedRound, TEMPLATES, type LinkedCard } from './linkedRound';

// Full-collection game, Japanese only until English glosses exist for all 795 poems.

const escape = (value: string | number) => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const groupLetters = ['A', 'B', 'C', 'D', 'E'];
const kindLabel = { single: 'Single poem', exchange: 'Poetic exchange', chorus: 'Poems from one gathering', solo: 'Private poems' } as const;

export function mountLinkedGame(root: HTMLElement, db: LinkedDatabase) {
  let phase: 'intro' | 'reading' | 'grouping' | 'results' = 'intro';
  let cards: LinkedCard[] = [];
  let position = 0;
  let seed = 'genji-full-1';
  let templateName = '2+2+1';
  let hardMode = false;
  let assignments = Array<string>(5).fill('');

  const japanese = (text: string, cls = 'japanese') => `<p class="${cls}" lang="ja">${text.split('/').map(escape).join('<br>')}</p>`;
  const groups = (labels: string[]) => [...new Set(labels)].map(label =>
    `<span class="group-chip">${labels.flatMap((value, index) => value === label ? [index + 1] : []).join(' + ')}</span>`).join('');

  function render(focusHeading = true) {
    root.innerHTML = `
      <header class="masthead"><a class="brand" href="./" aria-label="Genji-kō home">源氏香 <span>GENJI-KŌ</span></a><span class="edition">Full collection · Japanese</span></header>
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
        <p class="lead">Poems from the whole tale, in the original Japanese. Listen for shared words and images, and carry them in memory.</p>
        <ol class="instructions">
          <li><strong>Read</strong><span>Five waka, one at a time. Once you move on, the earlier text disappears.</span></li>
          <li><strong>Remember</strong><span>Poems that belong together share wording. Some poems stand alone.</span></li>
          <li><strong>Connect</strong><span>After reading all five, group their numbers. Revise freely, then submit once.</span></li>
        </ol>
        <form id="start-form" class="start-panel">
          <label for="template">Round shape</label>
          <select id="template">${Object.keys(TEMPLATES).map(name => `<option value="${name}" ${name === templateName ? 'selected' : ''}>${name}</option>`).join('')}</select>
          <label class="check"><input id="hard-toggle" type="checkbox" ${hardMode ? 'checked' : ''}> Hard mode: allow unrelated poems from the same chapter</label>
          <details class="demo-settings"><summary>Repeat a round</summary><label for="seed">Round seed</label><input id="seed" name="seed" maxlength="100" required value="${escape(seed)}"><p class="muted">The same seed and settings repeat the same poems and order.</p></details>
          <button id="start-button" class="primary" type="button">Begin the round</button>
        </form>
        <p class="prototype-note">Research prototype · Groupings and hooks are provisional; difficulty has not been calibrated.</p>
      </section>`;

    if (phase === 'reading') return `
      <section class="reading">
        <div class="stage-label"><p class="eyebrow">Read & remember</p><span>Poem ${position + 1} of 5</span></div>
        <div class="progress" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<span class="${i <= position ? 'filled' : ''}"></span>`).join('')}</div>
        <article class="poem-card">
          <h1 class="poem-number" tabindex="-1">Poem ${position + 1}</h1>
          <blockquote>${japanese(cards[position].poem.japanese)}</blockquote>
        </article>
        <div class="reading-controls"><p class="muted">Keep the wording in mind.<br>This text disappears when you continue.</p><button id="next" class="primary">${position === 4 ? 'Arrange your groups' : 'Next poem'}</button></div>
      </section>`;

    if (phase === 'grouping') return `
      <section class="answer">
        <p class="eyebrow">Connect from memory</p>
        <h1 tabindex="-1">Which poems<br><em>belong together?</em></h1>
        <p class="lead">Give matching poems the same group letter. A poem on its own needs its own letter. The letters themselves have no meaning.</p>
        <form id="answer-form">
          <fieldset><legend>Assign a group to each poem</legend>
            <div class="assignment-grid">${assignments.map((value, i) => `<label class="assignment" for="group-${i}"><span>Poem ${i + 1}</span><select id="group-${i}" name="group-${i}" required><option value="">Choose</option>${groupLetters.map(letter => `<option value="${letter}" ${value === letter ? 'selected' : ''}>Group ${letter}</option>`).join('')}</select></label>`).join('')}</div>
          </fieldset>
          <div class="group-preview" aria-live="polite" aria-atomic="true">${preview()}</div>
          <div class="reading-controls"><p class="muted">Change any assignment before submitting.<br>The poem texts return after your answer.</p><button id="submit-answer" class="primary" type="button" ${assignments.some(value => !value) ? 'disabled' : ''}>Submit grouping</button></div>
        </form>
      </section>`;

    const result = scoreLinkedRound(cards, assignments);
    const groupIndexes = [...new Set(cards.map(card => card.groupIndex))];
    return `
      <section class="results">
        <p class="eyebrow">The connections revealed</p>
        <h1 tabindex="-1">${result.exact ? 'Every connection found.' : 'Every poem tells a story.'}</h1>
        <p class="lead">${result.exact ? 'Your groups match the shared wording between the poems.' : 'Compare your memory of the poems with the connections below.'}</p>
        <div class="score-strip"><p><strong>${result.matchingPairsFound} / ${result.actualPairs}</strong><span>Matching pairs found</span></p><p><strong>${result.falseMatches}</strong><span>Incorrect pair connections</span></p><p><strong>${result.exact ? 'Complete' : 'Not yet'}</strong><span>Exact grouping</span></p></div>
        <div class="comparison"><div><h2>Your groups</h2>${groups(result.submitted)}</div><div><h2>Actual groups</h2>${groups(result.correct)}</div></div>
        <p class="muted">Numbers refer to the poems’ display positions. A number on its own is a singleton.</p>
        <div class="exchange-list">${groupIndexes.map(groupIndex => {
          const selected = cards.flatMap((card, index) => card.groupIndex === groupIndex ? [{ card, index }] : []);
          selected.sort((a, b) => a.card.poem.poem_id - b.card.poem.poem_id);
          const { bucket, hooks } = selected[0].card;
          const first = selected[0].card.poem;
          return `<article class="exchange">
            <p class="eyebrow">${selected.length === 1 ? 'Singleton' : escape(kindLabel[bucket.kind])} · Poem${selected.length === 1 ? '' : 's'} ${selected.map(item => item.index + 1).join(' & ')}</p>
            <h2>${escape(first.chapter_title_ja)} <span>· Chapter ${first.chapter_number}</span></h2>
            <p>${escape(bucket.context)}</p>
            ${hooks.length ? `<h3>Shared wording</h3><p class="hook" lang="ja">${hooks.map(escape).join(' ／ ')}</p>` : '<p class="singleton-note">No other poem in this round belongs with this one.</p>'}
            <div class="revealed-poems">${selected.map(({ card, index }) => `<div class="revealed-poem"><h3>Poem ${index + 1}</h3>${japanese(card.poem.japanese)}<p class="attribution">${escape(card.poem.speaker)}</p><p class="muted"><a href="${escape(card.poem.original_page_url)}" target="_blank" rel="noopener noreferrer">Source text</a> · Poem ${card.poem.poem_id} · ${escape(bucket.bucket_id)}</p></div>`).join('')}</div>
          </article>`;
        }).join('')}</div>
        <div class="end-controls"><button class="primary" id="new-round">Try a new round</button><button class="secondary" id="restart">Replay this round</button></div>
        <p class="muted">Round seed: <code>${escape(seed)}</code> · ${escape(templateName)}${hardMode ? ' · Hard mode' : ''}</p>
      </section>`;
  }

  function preview() {
    const unassigned = assignments.filter(value => !value).length;
    const assigned = groupLetters.filter(letter => assignments.includes(letter)).map(letter =>
      `<span class="group-chip">Group ${letter}: ${assignments.flatMap((value, i) => value === letter ? [i + 1] : []).join(' + ')}</span>`).join('');
    return `<h2>Your groups so far</h2>${assigned || '<p class="muted">Choose a letter for each poem to build your groups.</p>'}<p class="muted">${unassigned ? `${unassigned} poem${unassigned === 1 ? '' : 's'} still to assign.` : 'All five assigned. You can still change your groups.'}</p>`;
  }

  function start() {
    cards = generateLinkedRound(db, seed, { template: TEMPLATES[templateName], sameChapterRule: !hardMode });
    assignments = Array<string>(5).fill('');
    position = 0;
    phase = 'reading';
    render();
    window.scrollTo?.(0, 0);
  }

  function bind() {
    // Buttons are type="button" with click handlers: sandboxed previews without allow-forms block form submission.
    const begin = () => {
      seed = root.querySelector<HTMLInputElement>('#seed')!.value.trim() || 'genji-full-1';
      templateName = root.querySelector<HTMLSelectElement>('#template')!.value;
      hardMode = root.querySelector<HTMLInputElement>('#hard-toggle')!.checked;
      start();
    };
    root.querySelector('#start-button')?.addEventListener('click', begin);
    root.querySelector('#start-form')?.addEventListener('submit', event => { event.preventDefault(); begin(); });
    root.querySelector('#next')?.addEventListener('click', () => {
      if (position < 4) position++;
      else phase = 'grouping';
      render();
      window.scrollTo?.(0, 0);
    });
    root.querySelectorAll<HTMLSelectElement>('.assignment select').forEach((select, index) => {
      select.addEventListener('change', () => {
        assignments[index] = select.value;
        root.querySelector('.group-preview')!.innerHTML = preview();
        root.querySelector<HTMLButtonElement>('#submit-answer')!.disabled = assignments.some(value => !value);
      });
    });
    const submitAnswer = () => {
      if (assignments.some(value => !value)) return;
      phase = 'results';
      render();
      window.scrollTo?.(0, 0);
    };
    root.querySelector('#submit-answer')?.addEventListener('click', submitAnswer);
    root.querySelector('#answer-form')?.addEventListener('submit', event => { event.preventDefault(); submitAnswer(); });
    root.querySelector('#restart')?.addEventListener('click', start);
    root.querySelector('#new-round')?.addEventListener('click', () => {
      seed = `genji-${crypto.randomUUID()}`;
      phase = 'intro';
      render();
      window.scrollTo?.(0, 0);
    });
  }

  render(false);
}
