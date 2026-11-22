import rawDataset from '../data/genji_poetry_exchanges_pilot.json';
import { parseDataset } from './game';
import { mountGame } from './app';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app')!;
try {
  mountGame(root, parseDataset(rawDataset));
} catch (error) {
  console.error(error);
  root.innerHTML = '<main><h1>Unable to load the poetry collection</h1><p>The collection failed validation. Please report this error before continuing.</p></main>';
}
