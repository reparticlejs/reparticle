import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts'],
          exclude: ['tests/browser/**'],
        },
      },
      {
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.test.ts'],
          // Hosted runners can be slow to initialize WebGL and compile filter shaders.
          testTimeout: 60000,
          fileParallelism: false,
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: {
                channel: 'chromium',
                args: [
                  '--enable-unsafe-webgpu',
                  // Hosted Windows/Linux runners may have no usable hardware adapter.
                  ...(process.env.REPARTICLE_SOFTWARE_GPU === '1'
                    ? [
                        '--use-webgpu-adapter=swiftshader',
                        '--use-angle=swiftshader',
                        '--enable-unsafe-swiftshader',
                      ]
                    : []),
                ],
              },
            }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
