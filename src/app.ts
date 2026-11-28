import { generateRound, scoreRound, type Card, type Dataset } from './game';

const escape = (value: string | number) => String(value).replace(/[&<>"']/g, char =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const groupLetters = ['A', 'B', 'C', 'D', 'E'];

export function mountGame(root: HTMLElement, dataset: Dataset) {
  let phase: 'intro' | 'reading' | 'grouping' | 'results' = 'intro';
  let cards: Card[] = [];
  let position = 0;
  let seed = 'genji-demo-1';
  let showJapanese = false;
  let assignments = Array<string>(5).fill('');

  const japanese = (text: string) => `<p class="japanese" lang="ja">${text.split('/').map(escape).join('<br>')}</p>`;
  const groups = (labels: string[]) => [...new Set(labels)].map(label =>
    `<span class="group-chip">${labels.flatMap((value, index) => value === label ? [index + 1] : []).join(' + ')}</span>`).join('');

  function render(focusHeading = true) {
    root.innerHTML = `
      <header class="masthead"><a class="brand" href="./" aria-label="Genji-kō home">源氏香 <span>GENJI-KŌ</span></a><span class="edition">Poetry Exchange · Prototype</span></header>
      <main id="main" tabindex="-1">${content()}</main>
      <footer><span>A game of poetry, memory, and connection.</span><span>English glosses are provisional.</span></footer>`;
    bind();
    if (focusHeading) root.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true });
  }

  function content(): string {
    if (phase === 'intro') return `
      <section class="intro">
        <p class="eyebrow">Inspired by The Tale of Genji</p>
        <h1 tabindex="-1">Five poems.<br><em>Which belong together?</em></h1>
        <p class="lead">An image offered. An image answered. Listen for the connections between poems, and carry them in memory.</p>
        <ol class="instructions">
          <li><strong>Read</strong><span>Five poems, one at a time. Take your time; once you move on, the earlier text disappears.</span></li>
          <li><strong>Remember</strong><span>Find two pairs from real poetic exchanges. One poem stands alone in this round.</span></li>
          <li><strong>Connect</strong><span>After reading all five, group their numbers. Revise freely, then submit once.</span></li>
        </ol>
        <form id="start-form" class="start-panel">
          <label class="check"><input id="japanese-toggle" type="checkbox" ${showJapanese ? 'checked' : ''}> Show Japanese alongside English</label>
          <details class="demo-settings"><summary>Repeat a round</summary><label for="seed">Round seed</label><input id="seed" name="seed" maxlength="100" required value="${escape(seed)}"><p class="muted">The same seed repeats the same poems and order in this prototype.</p></details>
          <button id="start-button" class="primary" type="button">Begin the round</button>
        </form>
        <p class="prototype-note">Research prototype · Translations are provisional; round difficulty has not been calibrated.</p>
      </section>`;

    if (phase === 'reading') return `
      <section class="reading">
        <div class="stage-label"><p class="eyebrow">Read & remember</p><span>Poem ${position + 1} of 5</span></div>
        <div class="progress" aria-hidden="true">${Array.from({ length: 5 }, (_, i) => `<span class="${i <= position ? 'filled' : ''}"></span>`).join('')}</div>
        <article class="poem-card">
          <h1 class="poem-number" tabindex="-1">Poem ${position + 1}</h1>
          <blockquote>${escape(cards[position].poem.english_game_gloss)}</blockquote>
          ${showJapanese ? japanese(cards[position].poem.japanese) : ''}
          <p class="gloss-label">Provisional English game gloss</p>
        </article>
        <div class="reading-controls"><p class="muted">Keep the imagery in mind.<br>This text disappears when you continue.</p><button id="next" class="primary">${position === 4 ? 'Arrange your groups' : 'Next poem'}</button></div>
      </section>`;

    if (phase === 'grouping') return `
      <section class="answer">
        <p class="eyebrow">Connect from memory</p>
        <h1 tabindex="-1">Which poems answered<br><em>one another?</em></h1>
        <p class="lead">Give matching poems the same group letter. A poem on its own needs its own letter. The letters themselves have no meaning.</p>
        <form id="answer-form">
          <fieldset><legend>Assign a group to each poem</legend>
            <div class="assignment-grid">${assignments.map((value, i) => `<label class="assignment" for="group-${i}"><span>Poem ${i + 1}</span><select id="group-${i}" name="group-${i}" required><option value="">Choose</option>${groupLetters.map(letter => `<option value="${letter}" ${value === letter ? 'selected' : ''}>Group ${letter}</option>`).join('')}</select></label>`).join('')}</div>
          </fieldset>
          <div class="group-preview" aria-live="polite" aria-atomic="true">${preview()}</div>
          <div class="reading-controls"><p class="muted">Change any assignment before submitting.<br>The poem texts return after your answer.</p><button id="submit-answer" class="primary" type="button" ${assignments.some(value => !value) ? 'disabled' : ''}>Submit grouping</button></div>
        </form>
      </section>`;

    const result = scoreRound(cards, assignments);
    const exchangeIds = [...new Set(cards.map(card => card.exchange.exchange_id))];
    return `
      <section class="results">
        <p class="eyebrow">The connections revealed</p>
        <h1 tabindex="-1">${result.exact ? 'Every connection found.' : 'Every exchange tells a story.'}</h1>
        <p class="lead">${result.exact ? 'Your groups match the documented poetic exchanges.' : 'Compare your memory of the poems with their documented relationships below.'}</p>
        <div class="score-strip"><p><strong>${result.matchingPairsFound} / 2</strong><span>Matching pairs found</span></p><p><strong>${result.falseMatches}</strong><span>Incorrect pair connections</span></p><p><strong>${result.exact ? 'Complete' : 'Not yet'}</strong><span>Exact grouping</span></p></div>
        <div class="comparison"><div><h2>Your groups</h2>${groups(result.submitted)}</div><div><h2>Documented groups</h2>${groups(result.correct)}</div></div>
        <p class="muted">Numbers refer to the poems’ display positions. A number on its own is a singleton.</p>
        <div class="exchange-list">${exchangeIds.map(id => {
          const exchange = cards.find(card => card.exchange.exchange_id === id)!.exchange;
          const selected = cards.flatMap((card, index) => card.exchange.exchange_id === id ? [{ card, index }] : []);
          selected.sort((a, b) => a.card.poem.exchange_role === 'initiation' ? -1 : b.card.poem.exchange_role === 'initiation' ? 1 : 0);
          return `<article class="exchange">
            <p class="eyebrow">${selected.length === 1 ? 'Singleton' : 'Poetic exchange'} · Poem${selected.length === 1 ? '' : 's'} ${selected.map(item => item.index + 1).join(' & ')}</p>
            <h2>${escape(exchange.chapter_romaji)} <span>· Chapter ${exchange.chapter_number}</span></h2>
            <p>${escape(exchange.context)}</p>
            ${selected.length === 1 ? '<p class="singleton-note">Only one member of this exchange appeared in the round. Its partner was not shown.</p>' : ''}
            <div class="revealed-poems">${selected.map(({ card, index }) => `<div class="revealed-poem"><h3>Poem ${index + 1} · ${card.poem.exchange_role === 'initiation' ? 'Initiating verse' : 'Reply'}</h3><blockquote>${escape(card.poem.english_game_gloss)}</blockquote><p class="gloss-label">Provisional English game gloss</p>${japanese(card.poem.japanese)}<p class="attribution">${escape(card.poem.speaker)}<br><span>To ${escape(card.poem.recipient)}</span></p><p class="muted">Source poem ${card.poem.poem_id}</p></div>`).join('')}</div>
            <h3>How the exchange connects</h3><p>${escape(exchange.response_mechanism)}</p>
            <details><summary>Sources & editorial note</summary><p>${escape(exchange.verification.review_note)}</p><p class="muted">${escape(exchange.exchange_id)} · Dataset status: ${escape(exchange.verification.status)}. This does not certify complete scholarly or translation review.</p><ul>${exchange.source_urls.map(url => `<li><a href="${escape(url)}" target="_blank" rel="noopener noreferrer">${escape(new URL(url).hostname)} · ${escape(new URL(url).pathname)}</a></li>`).join('')}</ul></details>
          </article>`;
        }).join('')}</div>
        <div class="end-controls"><button class="primary" id="new-round">Try a new round</button><button class="secondary" id="restart">Replay this round</button></div>
        <p class="muted">Round seed: <code>${escape(seed)}</code> · Generator v1 · Dataset ${escape(dataset.version)}</p>
        <p class="muted">${escape(dataset.translation_credits)}</p>
      </section>`;
  }

  function preview() {
    const unassigned = assignments.filter(value => !value).length;
    const assigned = groupLetters.filter(letter => assignments.includes(letter)).map(letter =>
      `<span class="group-chip">Group ${letter}: ${assignments.flatMap((value, i) => value === letter ? [i + 1] : []).join(' + ')}</span>`).join('');
    return `<h2>Your groups so far</h2>${assigned || '<p class="muted">Choose a letter for each poem to build your groups.</p>'}<p class="muted">${unassigned ? `${unassigned} poem${unassigned === 1 ? '' : 's'} still to assign.` : 'All five assigned. You can still change your groups.'}</p>`;
  }

  function start() {
    cards = generateRound(dataset, seed);
    assignments = Array<string>(5).fill('');
    position = 0;
    phase = 'reading';
    render();
    window.scrollTo?.(0, 0);
  }

  function bind() {
    // Buttons are type="button" with click handlers: sandboxed previews without allow-forms block form submission.
    const begin = () => {
      seed = root.querySelector<HTMLInputElement>('#seed')!.value.trim() || 'genji-demo-1';
      showJapanese = root.querySelector<HTMLInputElement>('#japanese-toggle')!.checked;
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
    root.querySelectorAll<HTMLSelectElement>('select').forEach((select, index) => {
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
