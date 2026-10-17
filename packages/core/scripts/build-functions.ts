import { rename, writeFile } from 'node:fs/promises';

import { build } from 'tsdown';

const compiledCode = await compileFunctions();
const kernelSources = await extractSources(compiledCode);
await writeSources(kernelSources);

async function compileFunctions(): Promise<string> {
  const bundles = await build({
    config: false,
    entry: ['src/gpujs/functions.ts'],
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    // GPU.js needs the original names and expressions. Only remove whitespace.
    minify: { compress: false, mangle: false, codegen: { removeWhitespace: true } },
    dts: false,
    write: false,
    clean: false,
  });

  try {
    const chunks = bundles.flatMap((bundle) => bundle.chunks);
    const chunk = chunks[0];
    if (chunks.length !== 1 || !chunk || chunk.type !== 'chunk') {
      throw new Error('GPU functions must compile into one self-contained module');
    }
    return chunk.code;
  } finally {
    await Promise.all(bundles.map((bundle) => bundle[Symbol.asyncDispose]()));
  }
}

async function extractSources(code: string): Promise<Record<string, string>> {
  const encodedCode = Buffer.from(code).toString('base64');
  const functions: Record<string, unknown> = await import(
    `data:text/javascript;base64,${encodedCode}`
  );
  const sources: Record<string, string> = {};

  for (const [name, fn] of Object.entries(functions)) {
    if (typeof fn !== 'function' || fn.name !== name) {
      throw new Error(`GPU export ${name} must retain its function name`);
    }
    sources[name] = fn.toString();
  }

  return sources;
}

async function writeSources(sources: Record<string, string>): Promise<void> {
  const destination = 'src/gpujs/functions.json';
  const temporaryFile = `src/gpujs/functions.${process.pid}.json`;
  const json = `${JSON.stringify(sources, null, 2)}\n`;

  // Concurrent builds must never read a partially written file.
  await writeFile(temporaryFile, json);
  await rename(temporaryFile, destination);
}
