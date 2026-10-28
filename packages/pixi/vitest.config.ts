import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const webgpuTests = [
  'tests/browser/additive-blending.test.ts',
  'tests/browser/blend-modes.test.ts',
  'tests/browser/update-path.test.ts',
  'tests/browser/webgpu.test.ts',
  'tests/browser/pixi-webgpu.test.ts',
  'tests/browser/webgl2-mismatch.test.ts',
];

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
      ...(['webgl2', 'webgpu'] as const).map((backend) => ({
        test: {
          name: backend,
          include: backend === 'webgpu' ? webgpuTests : ['tests/browser/**/*.test.ts'],
          exclude: backend === 'webgpu' ? [] : webgpuTests,
          setupFiles: backend === 'webgpu' ? ['tests/support/require-webgpu.ts'] : [],
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
                  // Headless Chromium can otherwise choose SwiftShader for WebGL
                  // while WebGPU uses Metal, giving different trig precision.
                  ...(process.platform === 'darwin' ? ['--use-angle=metal'] : []),
                  // Hosted Windows/Linux runners use software WebGL2 only.
                  ...(backend === 'webgl2' && process.env.REPARTICLE_SOFTWARE_GPU === '1'
                    ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']
                    : []),
                ],
              },
            }),
            instances: [{ browser: 'chromium' as const }],
          },
        },
      })),
    ],
  },
});
