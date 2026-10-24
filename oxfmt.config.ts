import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: [
    '**/dist/**',
    'examples/site/src/content/api/core/**',
    'examples/site/src/content/api/pixi/**',
    '**/.astro/**',
    '**/coverage/**',
    '.pnpm-store/**',
    '.generated/**',
    '**/gpujs/functions.json',
    '.turbo/**',
    'pnpm-lock.yaml',
  ],
  overrides: [
    {
      files: ['**/*.json', '**/*.jsonc'],
      options: {
        trailingComma: 'none',
      },
    },
  ],
  printWidth: 100,
  singleQuote: true,
  sortImports: true,
  trailingComma: 'all',
});
