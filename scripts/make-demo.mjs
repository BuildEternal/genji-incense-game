import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// Bundle the already-built static app into a single offline file for demos.
// No poetry data is rewritten; it is embedded by Vite in the application bundle.
const directory = resolve('dist');
let html = await readFile(resolve(directory, 'index.html'), 'utf8');
const script = html.match(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/);
const stylesheet = html.match(/<link\b[^>]*href="([^"]+\.css)"[^>]*>/);
if (!script || !stylesheet) throw new Error('Expected one Vite entry script and stylesheet');
const asset = path => resolve(directory, path.replace(/^\//, ''));
const js = await readFile(asset(script[1]), 'utf8');
const css = await readFile(asset(stylesheet[1]), 'utf8');
html = html.replace(script[0], () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`);
html = html.replace(stylesheet[0], () => `<style>${css.replace(/<\/style/gi, '<\\/style')}</style>`);
await writeFile(resolve(directory, 'genji-poetry-demo.html'), html);
console.log('Offline demo: dist/genji-poetry-demo.html');
