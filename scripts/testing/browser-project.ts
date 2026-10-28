import { fileURLToPath } from 'node:url';

import { playwright } from '@vitest/browser-playwright';
import { defineProject } from 'vitest/config';

import { testAliases } from './aliases.ts';
import { chromiumOptions } from './chromium.ts';

/** Each package keeps its browser tests in tests/browser/<backend>. */
export function browserProject(backend: 'webgl2' | 'webgpu') {
  return defineProject({
    resolve: { alias: testAliases },
    test: {
      name: backend,
      include: [`tests/browser/${backend}/**/*.test.ts`],
      setupFiles:
        backend === 'webgpu'
          ? [fileURLToPath(new URL('./require-webgpu.ts', import.meta.url))]
          : [],
      // GPU readback and shader compilation take longer on hosted runners.
      testTimeout: 60000,
      fileParallelism: false,
      browser: {
        enabled: true,
        headless: true,
        provider: playwright({ launchOptions: chromiumOptions(backend) }),
        instances: [{ browser: 'chromium' }],
      },
    },
  });
}
