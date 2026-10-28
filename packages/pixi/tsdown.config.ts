import { defineConfig } from 'tsdown';

import { shaderPlugin } from './scripts/shader-plugin.ts';

export default defineConfig({
  entry: ['src/index.ts', 'src/webgl2.ts', 'src/webgpu.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'neutral',
  plugins: [shaderPlugin],
});
