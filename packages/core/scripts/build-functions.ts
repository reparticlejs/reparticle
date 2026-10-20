import { rename, writeFile } from 'node:fs/promises';

import { minify } from 'terser';
import { build } from 'tsdown';

// Run from packages/core. The output is shipped as data so consumer minifiers
// cannot rename GPU.js helpers or rewrite their numeric expressions.
const compiledModule = await compileFunctions();
const originalSources = await extractSources(compiledModule);
const kernelParameters = getKernelParameters(originalSources);
const mangledModule = await mangleFunctions(compiledModule, kernelParameters);
const sources = await extractSources(mangledModule);
await writeSources(sources);

/** Compile TypeScript and bundle every GPU helper into one in-memory ESM module. */
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

/**
 * Preserve the parameter names used by GPU.js's argumentTypes settings.
 * Read them from the unmangled kernels so new inputs are included automatically.
 */
function getKernelParameters(sources: Record<string, string>): string[] {
  const parameters: string[] = [];

  for (const name of ['initialize', 'integrate']) {
    const source = sources[name];
    if (!source) {
      throw new Error(`Missing GPU kernel: ${name}`);
    }
    parameters.push(...getParameterNames(source));
  }

  return parameters;
}

/**
 * Read a compiled function's simple identifier parameters.
 * GPU kernels use plain named functions without defaults, rest, or destructuring;
 * this reads their signatures only and never rewrites function source.
 */
function getParameterNames(source: string): string[] {
  const start = source.indexOf('(') + 1;
  const end = source.indexOf(')', start);
  const signature = source.slice(start, end).trim();

  if (signature === '') {
    return [];
  }

  return signature.split(',').map((parameter) => parameter.trim());
}

/**
 * Shorten bindings without compression or function-name changes.
 * A build-wide counter prevents short-name reuse across block scopes: GPU.js
 * otherwise confuses scalar and vector bindings that share a minified name.
 */
async function mangleFunctions(code: string, kernelParameters: string[]): Promise<string> {
  let nextIdentifier = 0;
  const result = await minify(code, {
    module: true,
    compress: false,
    keep_fnames: true,
    mangle: {
      reserved: kernelParameters,
      nth_identifier: { get: () => `v${(nextIdentifier++).toString(36)}` },
    },
    format: { comments: false },
  });
  if (!result.code) {
    throw new Error('GPU function minification produced no code');
  }
  return result.code;
}

/**
 * Load our compiled module and capture each named function as JavaScript text.
 * Checking names both before and after mangling protects GPU.js registrations.
 * Only the project's build output is executed; particle configuration is not.
 */
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

/** Atomically replace the tracked JSON only after compilation and extraction succeed. */
async function writeSources(sources: Record<string, string>): Promise<void> {
  const destination = 'src/simulation/functions.json';
  const temporaryFile = `src/simulation/functions.${process.pid}.json`;
  const json = `${JSON.stringify(sources, null, 2)}\n`;

  // Concurrent builds must never read a partially written file.
  await writeFile(temporaryFile, json);
  await rename(temporaryFile, destination);
}
