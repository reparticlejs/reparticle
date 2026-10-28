import { INPUT_ARGUMENTS, INPUT_LENGTHS } from '#simulation/data-layout.ts';
import type { SimulationUniformLayout } from '#types/simulation-uniform-layout.ts';

/** Describe the CPU input buffer shared by GLSL and WGSL. Sizes count float32 words. */
export function createInputLayout() {
  const layout: Record<string, SimulationUniformLayout> = {};
  let words = 0;

  for (const [name, length] of Object.entries(INPUT_LENGTHS)) {
    // Uniform arrays are packed into vec4s, so each input starts on a four-word boundary.
    const padded = Math.ceil(length / 4) * 4;
    layout[name] = { offset: words, length, padded };
    words += padded;
  }

  return {
    arguments: Object.fromEntries(INPUT_ARGUMENTS.map((name) => [name, name])),
    layout,
    words,
  };
}
