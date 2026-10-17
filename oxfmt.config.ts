import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: [
    '**/dist/**',
    '**/coverage/**',
    '.pnpm-store/**',
    '.generated/**',
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
