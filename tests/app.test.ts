// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import raw from '../data/genji_poetry_exchanges_pilot.json';
import { mountGame } from '../src/app';
import { canonicalLabels, generateRound, parseDataset } from '../src/game';

const dataset = parseDataset(raw);
let root: HTMLDivElement;
const button = (id: string) => root.querySelector<HTMLButtonElement>(id)!;

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  root = document.querySelector('#app')!;
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  mountGame(root, dataset);
});

describe('complete player flow', () => {
  it('shows one poem at a time, hides metadata, allows revisions, and reveals only after submission', () => {
    const cards = generateRound(dataset, 'genji-demo-1');
    button('#start-button').click();
    for (let i = 0; i < 5; i++) {
      expect(root.querySelectorAll('blockquote')).toHaveLength(1);
      expect(root.querySelector('blockquote')!.textContent).toBe(cards[i].poem.english_game_gloss);
      expect(root.querySelector('[lang="ja"]')).toBeNull();
      expect(root.querySelector('a[target="_blank"]')).toBeNull();
      for (const card of cards) expect(root.textContent).not.toContain(card.exchange.exchange_id);
      expect(document.activeElement?.tagName).toBe('H1');
      button('#next').click();
    }
    expect(root.querySelector('blockquote')).toBeNull();
    for (const card of cards) expect(root.textContent).not.toContain(card.poem.english_game_gloss);
    expect(button('#submit-answer').disabled).toBe(true);
    button('#submit-answer').click();
    expect(root.querySelectorAll('select')).toHaveLength(5);
    const selects = [...root.querySelectorAll<HTMLSelectElement>('select')];
    const answer = canonicalLabels(cards.map(card => card.exchange.exchange_id));
    selects.forEach((select, i) => {
      select.value = answer[i];
      select.dispatchEvent(new Event('change'));
    });
    expect(button('#submit-answer').disabled).toBe(false);
    selects[0].value = 'E';
    selects[0].dispatchEvent(new Event('change'));
    expect(root.querySelector('.group-preview')!.textContent).toContain('Group E');
    selects[0].value = answer[0];
    selects[0].dispatchEvent(new Event('change'));
    button('#submit-answer').click();
    expect(root.textContent).toContain('Every connection found.');
    expect(root.querySelectorAll('blockquote')).toHaveLength(5);
    expect(root.querySelectorAll('[lang="ja"]')).toHaveLength(5);
    expect(root.querySelectorAll('.exchange')).toHaveLength(3);
    expect(root.querySelector('a[target="_blank"]')).not.toBeNull();
    expect(root.textContent).toContain('partner was not shown');
    button('#restart').click();
    expect(root.querySelector('blockquote')!.textContent).toBe(cards[0].poem.english_game_gloss);
    expect(root.querySelector('.results')).toBeNull();
  });

  it('supports Japanese during reading, an incorrect result, and a fresh round', () => {
    root.querySelector<HTMLInputElement>('#japanese-toggle')!.checked = true;
    button('#start-button').click();
    expect(root.querySelector('[lang="ja"]')).not.toBeNull();
    for (let i = 0; i < 5; i++) button('#next').click();
    root.querySelectorAll('select').forEach((select, i) => {
      select.value = String.fromCharCode(65 + i);
      select.dispatchEvent(new Event('change'));
    });
    button('#submit-answer').click();
    expect(root.textContent).toContain('Every exchange tells a story.');
    expect(root.textContent).toContain('0 / 2');
    button('#new-round').click();
    expect(root.querySelector('#start-form')).not.toBeNull();
    expect(root.querySelector<HTMLInputElement>('#seed')!.value).not.toBe('genji-demo-1');
    expect(root.querySelectorAll('blockquote')).toHaveLength(0);
  });
});
