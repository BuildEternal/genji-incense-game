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

// Web Audio plays a decoded buffer with almost no delay. A new <audio> element per play has to
// decode first, which is audibly late, so it is only the fallback while buffers load.
type Ctx = AudioContext;
let ctx: Ctx | null = null;
const buffers = new Map<string, AudioBuffer>();
let loading: Promise<void> | null = null;

function context(): Ctx | null {
  if (ctx) return ctx;
  const Ctor = typeof window === 'undefined' ? undefined : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Ctor) return null;
  try { ctx = new Ctor(); } catch { return null; }
  return ctx;
}

/** Decode every clip once, ahead of time. An offline context needs no user gesture. */
export function preloadSound() {
  if (loading || typeof OfflineAudioContext === 'undefined' || typeof fetch === 'undefined') return;
  const decoder = new OfflineAudioContext(1, 1, 48000);
  loading = Promise.all(Object.entries(SOURCES).map(async ([key, url]) => {
    const data = await (await fetch(url)).arrayBuffer();
    buffers.set(key, await decoder.decodeAudioData(data));
  })).then(() => {}, () => {});
}

/** Start the live audio context from a user gesture (first tap, click or key). */
export function warmUpSound() {
  const c = context();
  if (c && c.state === 'suspended') void c.resume().catch(() => {});
  preloadSound();
}

export function play(name: SoundName) {
  if (!enabled) return;
  const key = name === 'pluck' ? (['pluck1', 'pluck2', 'pluck3'] as const)[pluckIndex++ % 3] : name;
  const volume = VOLUME[name] ?? 0.7;
  const c = context();
  const buffer = buffers.get(key);
  if (c && buffer) {
    if (c.state === 'suspended') void c.resume().catch(() => {});
    const source = c.createBufferSource();
    const gain = c.createGain();
    source.buffer = buffer;
    gain.gain.value = volume;
    source.connect(gain).connect(c.destination);
    source.start();
    return;
  }
  if (c) warmUpSound();
  if (typeof Audio === 'undefined') return;
  try {
    const audio = new Audio(SOURCES[key]);
    audio.volume = volume;
    void audio.play()?.catch(() => {});
  } catch { /* playback unavailable */ }
}
