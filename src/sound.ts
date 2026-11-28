import begin from './assets/sounds/begin.mp3';
import click from './assets/sounds/click.mp3';
import gyoku from './assets/sounds/gyoku.mp3';
import paper from './assets/sounds/paper.mp3';
import pluck1 from './assets/sounds/pluck1.mp3';
import pluck2 from './assets/sounds/pluck2.mp3';
import pluck3 from './assets/sounds/pluck3.mp3';

// Found recordings only (see ASSETS.md). Sound starts on (it only plays after a click); muting is remembered.
const SOURCES = { begin, click, gyoku, paper, pluck1, pluck2, pluck3 } as const;
export type SoundName = keyof typeof SOURCES | 'pluck';
const KEY = 'genji-ko-sound';
const VOLUME: Partial<Record<SoundName, number>> = { click: 0.5, paper: 0.8, begin: 0.7, gyoku: 0.8 };

let enabled = (() => { try { return localStorage.getItem(KEY) !== 'off'; } catch { return true; } })();
let pluckIndex = 0;

export const soundEnabled = () => enabled;
export function setSoundEnabled(value: boolean) {
  enabled = value;
  try { localStorage.setItem(KEY, value ? 'on' : 'off'); } catch { /* storage unavailable */ }
}

export function play(name: SoundName) {
  if (!enabled || typeof Audio === 'undefined') return;
  const key = name === 'pluck' ? (['pluck1', 'pluck2', 'pluck3'] as const)[pluckIndex++ % 3] : name;
  try {
    const audio = new Audio(SOURCES[key]);
    audio.volume = VOLUME[name] ?? 0.7;
    void audio.play()?.catch(() => {});
  } catch { /* playback unavailable */ }
}
