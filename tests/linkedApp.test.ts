// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import rawBuckets from '../data/genji_buckets.json';
import poemsJsonl from '../data/genji_poems_v2.jsonl?raw';
import { parseLinkedDatabase } from '../src/buckets';
import { patternFor } from '../src/genjiko';
import { mountLinkedGame, ROUNDS_PER_GAME, tutorialCards } from '../src/linkedApp';
import { correctLabels, generateLinkedRound } from '../src/linkedRound';

// Japanese-only database (no glosses): the fallback display.
const db = parseLinkedDatabase(poemsJsonl, rawBuckets);
let root: HTMLDivElement;
const button = (id: string) => root.querySelector<HTMLButtonElement>(id)!;
// Colour each poem: label A = first dye (one click), B = second (two clicks), …
const answer = (labels: string[]) => labels.forEach((label, i) => {
  for (let k = 0; k <= label.charCodeAt(0) - 65; k++) root.querySelector<HTMLButtonElement>(`.dye[data-poem="${i}"]`)!.click();
});
const readAll = () => { for (let i = 0; i < 5; i++) button('#next').click(); };
const chooseMode = (mode: string) => { root.querySelector<HTMLInputElement>(`input[name="mode"][value="${mode}"]`)!.checked = true; };

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.querySelector('#app')!;
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  mountLinkedGame(root, db);
});

describe('full-collection game', () => {
  it('shows one poem at a time and hides answers until submission', () => {
    const cards = generateLinkedRound(db, 'genji-game-1#1');
    button('#start-button').click();
    for (let i = 0; i < 5; i++) {
      expect(root.querySelectorAll('main .ja')).toHaveLength(1);
      expect(root.querySelector('main .ja')!.textContent).toBe(cards[i].poem.japanese.split('/').join(''));
      for (const card of cards) {
        expect(root.textContent).not.toContain(card.bucket.bucket_id);
        expect(root.textContent).not.toContain(card.poem.speaker);
      }
      button('#next').click();
    }
    expect(root.querySelector('.ja')).toBeNull();
    expect(root.querySelectorAll('.dye.empty')).toHaveLength(5);
    answer(correctLabels(cards));
    button('#submit-answer').click();
    expect(root.querySelector('.seal.stamp')).not.toBeNull();
    expect(root.textContent).toContain(patternFor(correctLabels(cards)).romaji);
    const hookText = [...root.querySelectorAll('.hook')].map(el => el.textContent).join(' ');
    for (const hook of cards.flatMap(card => card.hooks)) expect(hookText).toContain(hook);
  });

  it('cycles colour buttons, draws the pattern live, and enables submit only when all are coloured', () => {
    button('#start-button').click();
    readAll();
    expect(button('#submit-answer').disabled).toBe(true);
    // Buttons run right to left: poem 1 is the last in document order.
    expect([...root.querySelectorAll<HTMLButtonElement>('.dye')].map(b => b.dataset.poem)).toEqual(['4', '3', '2', '1', '0']);
    answer(['A', 'B', 'C', 'B']);
    expect(button('#submit-answer').disabled).toBe(true);
    expect(root.querySelector('.live-name')!.textContent).toContain('1 poem still to colour');
    root.querySelector<HTMLButtonElement>('.dye[data-poem="4"]')!.click(); // poem 5 → first colour
    expect(root.querySelector('.live-name')!.textContent).toContain('真木柱');
    expect(button('#submit-answer').disabled).toBe(false);
    // Cycling past the fifth colour wraps to the first; right-click steps back.
    const first = root.querySelector<HTMLButtonElement>('.dye[data-poem="0"]')!;
    expect(first.className).toContain('dye-ai');
    for (let k = 0; k < 5; k++) root.querySelector<HTMLButtonElement>('.dye[data-poem="0"]')!.click();
    expect(root.querySelector('.dye[data-poem="0"]')!.className).toContain('dye-ai');
    root.querySelector('.dye[data-poem="0"]')!.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
    expect(root.querySelector('.dye[data-poem="0"]')!.className).toContain('dye-fuji');
  });

  it('plays five rounds, counts only exact patterns, and summarizes', () => {
    chooseMode('hard');
    button('#start-button').click();
    let expected = 0;
    for (let round = 0; round < ROUNDS_PER_GAME; round++) {
      const cards = generateLinkedRound(db, `genji-game-1#${round + 1}`, { sameChapterRule: false });
      expect(root.querySelector('.where')!.textContent).toContain(`Round ${round + 1} of ${ROUNDS_PER_GAME}`);
      readAll();
      const right = correctLabels(cards);
      // Rounds 1, 3, 5 exact; rounds 2 and 4 wrong (a different pattern).
      const labels = round % 2 === 0 ? right : (right.join('') === 'ABCDE' ? ['A', 'A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E']);
      if (round % 2 === 0) expected++;
      answer(labels);
      button('#submit-answer').click();
      expect(root.textContent).toContain('Feedback only');
      button('#next-round').click();
    }
    expect(root.querySelector('h1')!.textContent).toContain(`${expected} 玉`);
    expect(root.querySelectorAll('.record-rounds li')).toHaveLength(ROUNDS_PER_GAME);
    expect(root.querySelectorAll('.record-rounds li.won')).toHaveLength(expected);
    button('#new-game').click();
    expect(root.querySelector<HTMLInputElement>('#seed')!.value).not.toBe('genji-game-1');
  });

  it('easy mode lets the player reopen any poem in a popup while grouping', () => {
    chooseMode('easy');
    button('#start-button').click();
    const cards = generateLinkedRound(db, 'genji-game-1#1');
    readAll();
    expect(root.querySelectorAll('.reread')).toHaveLength(5);
    root.querySelector<HTMLButtonElement>('.reread[data-poem="2"]')!.click();
    expect(root.querySelector('.popup')).not.toBeNull();
    expect(root.querySelector('.popup .ja')!.textContent).toBe(cards[2].poem.japanese.split('/').join(''));
    button('#close-popup').click();
    expect(root.querySelector('.popup')).toBeNull();
  });

  it('normal mode gives no reread', () => {
    button('#start-button').click();
    readAll();
    expect(root.querySelector('.reread')).toBeNull();
    expect(root.querySelector('.popup')).toBeNull();
  });

  it('runs an unscored practice round with tips, then starts the real game', () => {
    button('#tutorial-button').click();
    expect(root.querySelector('.tip')).not.toBeNull();
    expect(root.querySelector('.where')!.textContent).toContain('Practice');
    readAll();
    answer(['A', 'B', 'C', 'B', 'A']);
    button('#submit-answer').click();
    expect(root.textContent).toContain('真木柱');
    expect(root.querySelector('.seal.stamp')).not.toBeNull();
    button('#start-after-tutorial').click();
    expect(root.querySelector('.where')!.textContent).toContain('Round 1 of 5');
    expect(root.querySelector('.tip')).toBeNull();
  });
});

describe('tutorial round', () => {
  it('is the fixed A B C B A round with links for both pairs', () => {
    const cards = tutorialCards(db);
    expect(cards.map(card => card.poem.poem_id)).toEqual([26, 206, 483, 207, 27]);
    expect(correctLabels(cards)).toEqual(['A', 'B', 'C', 'B', 'A']);
    expect(cards[0].hooks).toHaveLength(1);
    expect(cards[2].hooks).toHaveLength(0);
  });
});

describe('sound', () => {
  it('starts off and remembers the toggle', () => {
    document.body.innerHTML = '<div id="app"></div>';
    const el = document.querySelector<HTMLDivElement>('#app')!;
    localStorage.removeItem('genji-ko-sound');
    mountLinkedGame(el, db);
    const toggle = el.querySelector<HTMLButtonElement>('#sound-toggle')!;
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    toggle.click();
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('genji-ko-sound')).toBe('on');
    toggle.click();
    expect(localStorage.getItem('genji-ko-sound')).toBe('off');
  });
});
