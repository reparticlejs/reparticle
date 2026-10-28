import { defineConfig } from 'vitest/config';

import { testAliases } from '../../scripts/testing/aliases.ts';
import { browserProject } from '../../scripts/testing/browser-project.ts';

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: testAliases },
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/browser/**'],
        },
      },
      browserProject('webgl2'),
      browserProject('webgpu'),
    ],
  },
});
