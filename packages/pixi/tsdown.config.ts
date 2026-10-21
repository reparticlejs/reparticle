import { defineConfig } from 'tsdown';

import { shaderPlugin } from './scripts/shader-plugin.ts';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  platform: 'neutral',
  plugins: [shaderPlugin],
});
