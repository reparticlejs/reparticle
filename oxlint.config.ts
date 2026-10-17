import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
  },
  ignorePatterns: [
    '**/dist/**',
    '**/coverage/**',
    '.pnpm-store/**',
    '.generated/**',
    'packages/core/src/gpujs/functions.json',
    '.turbo/**',
  ],
  options: {
    typeAware: true,
  },
  plugins: ['typescript', 'vitest', 'promise', 'node', 'import'],
  jsPlugins: [{ name: 'import-js', specifier: 'eslint-plugin-import-x' }],
  rules: {
    curly: 'error',
    'import-js/no-extraneous-dependencies': ['error', { includeTypes: true }],
    'no-restricted-imports': [
      'error',
      {
        paths: [
          {
            name: 'react',
            importNames: ['useEffect', 'default'],
            allowTypeImports: true,
            message:
              'No direct useEffect. Use derived values, event handlers, or useSyncExternalStore. For external mount/cleanup only, use useMountEffect. Import React APIs by name.',
          },
        ],
      },
    ],
    'import/no-unassigned-import': ['error', { allow: ['**/*.css'] }],
  },
  overrides: [
    {
      files: ['examples/demo/src/**/*.{ts,tsx}'],
      plugins: ['react', 'jsx-a11y'],
      env: { browser: true },
      rules: {
        'react/rules-of-hooks': 'error',
        'react/react-in-jsx-scope': 'off',
        'react/exhaustive-deps': 'warn',
        'react/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
  ],
});
