// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import rawBuckets from '../data/genji_buckets.json';
import poemsJsonl from '../data/genji_poems_v2.jsonl?raw';
import { parseLinkedDatabase } from '../src/buckets';
import { mountLinkedGame } from '../src/linkedApp';
import { correctLabels, generateLinkedRound, TEMPLATES } from '../src/linkedRound';

const db = parseLinkedDatabase(poemsJsonl, rawBuckets);
let root: HTMLDivElement;
const button = (id: string) => root.querySelector<HTMLButtonElement>(id)!;
const answer = (labels: string[]) => root.querySelectorAll<HTMLSelectElement>('.assignment select').forEach((select, i) => {
  select.value = labels[i];
  select.dispatchEvent(new Event('change'));
});

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.querySelector('#app')!;
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  mountLinkedGame(root, db);
});

describe('full-collection player flow', () => {
  it('shows one Japanese poem at a time, hides answers, and reveals hooks after submission', () => {
    const cards = generateLinkedRound(db, 'genji-full-1');
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
    expect(root.querySelector('[lang="ja"]')).toBeNull();
    answer(correctLabels(cards));
    button('#submit-answer').click();
    expect(root.textContent).toContain('Every connection found.');
    expect(root.textContent).toContain('2 / 2');
    expect(root.querySelectorAll('.exchange')).toHaveLength(3);
    const hookText = [...root.querySelectorAll('.hook')].map(el => el.textContent).join(' ');
    for (const hook of cards.flatMap(card => card.hooks)) expect(hookText).toContain(hook);
    expect(root.querySelector('a[target="_blank"]')).not.toBeNull();
  });

  it('uses the chosen round shape and hard mode, and scores a wrong answer', () => {
    root.querySelector<HTMLSelectElement>('#template')!.value = '3+1+1';
    root.querySelector<HTMLInputElement>('#hard-toggle')!.checked = true;
    button('#start-button').click();
    const cards = generateLinkedRound(db, 'genji-full-1', { template: TEMPLATES['3+1+1'], sameChapterRule: false });
    expect(root.querySelector('[lang="ja"]')!.innerHTML).toBe(cards[0].poem.japanese.split('/').join('<br>'));
    for (let i = 0; i < 5; i++) button('#next').click();
    answer(['A', 'B', 'C', 'D', 'E']);
    button('#submit-answer').click();
    expect(root.textContent).toContain('0 / 3');
    expect(root.textContent).toContain('Hard mode');
    button('#new-round').click();
    expect(root.querySelector<HTMLInputElement>('#seed')!.value).not.toBe('genji-full-1');
  });
});
