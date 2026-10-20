import { rename, writeFile } from 'node:fs/promises';

import { minify } from 'terser';
import { build } from 'tsdown';

const compiledCode = await compileFunctions();
const compactCode = await mangleFunctions(compiledCode);
const kernelSources = await extractSources(compactCode);
await writeSources(kernelSources);

async function compileFunctions(): Promise<string> {
  const bundles = await build({
    config: false,
    entry: ['src/simulation/functions.ts'],
    format: 'esm',
    platform: 'neutral',
    target: 'es2022',
    // Leave identifier mangling to Terser, which supports our unique-name generator.
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

async function mangleFunctions(code: string): Promise<string> {
  // Kernel argument settings are keyed by parameter name. Read the compiled
  // signatures so adding an input does not require maintaining a second list.
  const functions = await extractSources(code);
  const reserved = [functions.initialize!, functions.integrate!].flatMap((source) =>
    source
      .slice(source.indexOf('(') + 1, source.indexOf(')'))
      .split(',')
      .map((parameter) => parameter.trim())
      .filter(Boolean),
  );
  let nextIdentifier = 0;
  const result = await minify(code, {
    module: true,
    compress: false,
    keep_fnames: true,
    mangle: {
      reserved,
      // GPU.js confuses scalar/vector bindings when a minifier reuses a name in
      // different block scopes. Give every renamed binding its own short name.
      nth_identifier: { get: () => `v${(nextIdentifier++).toString(36)}` },
    },
    format: { comments: false },
  });
  if (!result.code) {
    throw new Error('GPU function minification produced no code');
  }
  return result.code;
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
  const destination = 'src/simulation/functions.json';
  const temporaryFile = `src/simulation/functions.${process.pid}.json`;
  const json = `${JSON.stringify(sources, null, 2)}\n`;

  // Concurrent builds must never read a partially written file.
  await writeFile(temporaryFile, json);
  await rename(temporaryFile, destination);
}
