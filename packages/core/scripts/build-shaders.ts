import { writeFile, rename } from 'node:fs/promises';

import install from 'unplugin-typegpu/node';

// Install the public TypeGPU source transform before importing authored shaders.
// It runs only in this build process; consumers receive GLSL, never the compiler.
const hooks = install();

try {
  const { compileSimulation } = await import('./shaders/compile.ts');
  const destination = new URL('../src/simulation/shaders.json', import.meta.url);
  const temporary = new URL(`../src/simulation/shaders.${process.pid}.json`, import.meta.url);
  await writeFile(temporary, JSON.stringify(compileSimulation(), null, 2) + '\n');
  await rename(temporary, destination);
} finally {
  hooks.deregister();
}
