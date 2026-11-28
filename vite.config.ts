import { defineConfig } from 'vite';

// Inline fonts and sounds as data URLs so the single-file offline demo carries them.
export default defineConfig({
  base: './',
  build: { assetsInlineLimit: 400_000 },
});
