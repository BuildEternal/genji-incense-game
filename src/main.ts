import rawDataset from '../data/genji_poetry_exchanges_pilot.json';
import rawBuckets from '../data/genji_buckets.json';
import poemsJsonl from '../data/genji_poems_v2.jsonl?raw';
import { parseDataset } from './game';
import { parseLinkedDatabase } from './buckets';
import { mountGame } from './app';
import { mountLinkedGame } from './linkedApp';
import './style.css';

// Default: the full 795-poem collection (Japanese only). `?pilot` plays the 15-exchange English pilot.
const root = document.querySelector<HTMLDivElement>('#app')!;
try {
  if (new URLSearchParams(location.search).has('pilot')) mountGame(root, parseDataset(rawDataset));
  else mountLinkedGame(root, parseLinkedDatabase(poemsJsonl, rawBuckets));
} catch (error) {
  console.error(error);
  root.innerHTML = '<main><h1>Unable to load the poetry collection</h1><p>The collection failed validation. Please report this error before continuing.</p></main>';
}
