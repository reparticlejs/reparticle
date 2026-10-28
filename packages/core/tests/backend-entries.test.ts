import { fileURLToPath } from 'node:url';

import { build } from 'tsdown';
import { expect, it } from 'vitest';

it.each(['index', 'webgl2', 'webgpu'])('%s exposes only its intended backend', async (entry) => {
  const bundles = await build({
    config: false,
    entry: [fileURLToPath(new URL(`../dist/${entry}.js`, import.meta.url))],
    format: 'esm',
    platform: 'browser',
    dts: false,
    clean: false,
    write: false,
    logLevel: 'error',
  });
  try {
    const chunks = bundles
      .flatMap((bundle) => bundle.chunks)
      .filter((chunk) => chunk.type === 'chunk');
    const source = chunks.map((chunk) => chunk.code).join('\n');
    const exports = chunks.find((chunk) => chunk.isEntry)!.exports;
    expect(exports).toContain('EmitterController');
    expect(exports.includes('Emitter')).toBe(entry !== 'index');
    expect(exports.includes('createSimulationContext')).toBe(entry !== 'index');
    expect(source.includes('createFramebuffer')).toBe(entry === 'webgl2');
    expect(source.includes('@compute')).toBe(entry === 'webgpu');
    expect(chunks.flatMap((chunk) => chunk.dynamicImports)).toEqual([]);
  } finally {
    for (const bundle of bundles) {
      await bundle[Symbol.asyncDispose]();
    }
  }
});
