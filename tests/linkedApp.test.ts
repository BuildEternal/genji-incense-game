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
const answer = (labels: string[]) => root.querySelectorAll<HTMLSelectElement>('.assignment select').forEach((select, i) => {
  select.value = labels[i];
  select.dispatchEvent(new Event('change'));
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
      expect(root.querySelectorAll('[lang="ja"]')).toHaveLength(1);
      expect(root.querySelector('[lang="ja"]')!.innerHTML).toBe(cards[i].poem.japanese.split('/').join('<br>'));
      for (const card of cards) {
        expect(root.textContent).not.toContain(card.bucket.bucket_id);
        expect(root.textContent).not.toContain(card.poem.speaker);
      }
      button('#next').click();
    }
    expect(root.querySelector('.japanese')).toBeNull();
    expect(root.querySelectorAll('.chart-cell')).toHaveLength(52);
    answer(correctLabels(cards));
    button('#submit-answer').click();
    expect(root.querySelector('h1')!.textContent).toContain('玉');
    expect(root.textContent).toContain(patternFor(correctLabels(cards)).romaji);
    const hookText = [...root.querySelectorAll('.hook')].map(el => el.textContent).join(' ');
    for (const hook of cards.flatMap(card => card.hooks)) expect(hookText).toContain(hook);
  });

  it('lets the chart set the answer and shows the matching pattern', () => {
    button('#start-button').click();
    readAll();
    expect(button('#submit-answer').disabled).toBe(true);
    const cell = root.querySelector<HTMLButtonElement>('.chart-cell[data-key="ABCBA"]')!;
    cell.click();
    expect([...root.querySelectorAll<HTMLSelectElement>('.assignment select')].map(s => s.value)).toEqual(['A', 'B', 'C', 'B', 'A']);
    expect(root.querySelector('.pattern-preview')!.textContent).toContain('真木柱');
    expect(cell.classList.contains('selected')).toBe(true);
    expect(button('#submit-answer').disabled).toBe(false);
  });

  it('plays five rounds, counts only exact patterns, and summarizes', () => {
    chooseMode('hard');
    button('#start-button').click();
    let expected = 0;
    for (let round = 0; round < ROUNDS_PER_GAME; round++) {
      const cards = generateLinkedRound(db, `genji-game-1#${round + 1}`, { sameChapterRule: false });
      expect(root.querySelector('.edition')!.textContent).toContain(`Round ${round + 1} of ${ROUNDS_PER_GAME}`);
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
    expect(root.querySelectorAll('.round-list li')).toHaveLength(ROUNDS_PER_GAME);
    expect(root.querySelectorAll('.round-list li.won')).toHaveLength(expected);
    button('#new-game').click();
    expect(root.querySelector<HTMLInputElement>('#seed')!.value).not.toBe('genji-game-1');
  });

  it('easy mode lets the player reread all five poems while grouping', () => {
    chooseMode('easy');
    button('#start-button').click();
    readAll();
    expect(root.querySelectorAll('.reread-poem')).toHaveLength(5);
    expect(root.querySelectorAll('[lang="ja"].japanese')).toHaveLength(5);
  });

  it('normal mode gives no reread', () => {
    button('#start-button').click();
    readAll();
    expect(root.querySelector('.reread')).toBeNull();
  });

  it('runs an unscored practice round with tips, then starts the real game', () => {
    button('#tutorial-button').click();
    expect(root.querySelector('.tutorial-tip')).not.toBeNull();
    expect(root.querySelector('.edition')!.textContent).toContain('Practice round');
    readAll();
    answer(['A', 'B', 'C', 'B', 'A']);
    button('#submit-answer').click();
    expect(root.textContent).toContain('真木柱');
    expect(root.querySelector('h1')!.textContent).toContain('玉');
    button('#start-after-tutorial').click();
    expect(root.querySelector('.edition')!.textContent).toContain('Round 1 of 5');
    expect(root.querySelector('.tutorial-tip')).toBeNull();
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
