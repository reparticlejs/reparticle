import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { build } from 'tsdown';
import { expect, it } from 'vitest';

it.each(['webgl2', 'webgpu', 'index'])(
  '%s bundles only the selected backend or lazy chunks',
  async (entry) => {
    const bundles = await build({
      config: false,
      entry: [fileURLToPath(new URL(`../dist/${entry}.js`, import.meta.url))],
      format: 'esm',
      platform: 'browser',
      dts: false,
      clean: false,
      write: false,
      deps: { alwaysBundle: [/^@reparticle\//, /^zod/], neverBundle: ['pixi.js'] },
      logLevel: 'error',
    });
    try {
      const chunks = bundles
        .flatMap((bundle) => bundle.chunks)
        .filter((chunk) => chunk.type === 'chunk');
      const source = chunks.map((chunk) => chunk.code).join('\n');
      expect(source.includes('@compute')).toBe(entry !== 'webgl2');
      expect(source.includes('createFramebuffer')).toBe(entry !== 'webgpu');
      const main = chunks.find((chunk) => chunk.isEntry)!;
      expect(Boolean(main)).toBe(true);
      expect(main.dynamicImports.length > 0).toBe(entry === 'index');
      // Follow static imports too: the automatic entry must not eagerly pull either shader.
      const visited = new Set<string>();
      const initialSources: string[] = [];
      const visit = (fileName: string) => {
        if (visited.has(fileName)) {
          return;
        }
        visited.add(fileName);
        const chunk = chunks.find((candidate) => candidate.fileName === fileName);
        if (!chunk) {
          return;
        }
        initialSources.push(chunk.code);
        chunk.imports.forEach(visit);
      };
      visit(main.fileName);
      const initial = initialSources.join('\n');
      expect(initial.includes('@compute')).toBe(entry === 'webgpu');
      expect(initial.includes('createFramebuffer')).toBe(entry === 'webgl2');
      console.info('Initial bytes:', initial.length);
      console.info(
        `${entry}: ${source.length} bytes, ${gzipSync(source).length} gzip (Pixi external)`,
      );
    } finally {
      for (const bundle of bundles) {
        await bundle[Symbol.asyncDispose]();
      }
    }
  },
);
