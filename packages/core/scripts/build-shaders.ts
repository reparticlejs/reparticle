import { writeFile, rename } from 'node:fs/promises';

import install from 'unplugin-typegpu/node';

// Install the public TypeGPU source transform before importing authored shaders.
// It runs only in this build process; consumers receive shaders, never the compiler.
const hooks = install();

try {
  const { compileWebGL2, compileWebGPU } = await import('./shaders/compile.ts');
  const webgl2 = compileWebGL2();
  const webgpu = compileWebGPU();

  await Promise.all([writeShader('webgl2.json', webgl2), writeShader('webgpu.json', webgpu)]);
} finally {
  hooks.deregister();
}

/** Replace each generated file only after its complete JSON has been written. */
async function writeShader(filename: string, shader: unknown): Promise<void> {
  const destination = new URL(`../src/simulation/shaders/${filename}`, import.meta.url);
  const temporary = new URL(`${destination.href}.${process.pid}.tmp`);
  const json = JSON.stringify(shader, null, 2) + '\n';

  await writeFile(temporary, json);
  await rename(temporary, destination);
}
