import { readFileSync } from 'node:fs';

import { glOptions } from '@typegpu/gl';
import { tgpu } from 'typegpu';

import { integrate } from '#simulation/kernels/integrate.ts';
import {
  INPUT_ARGUMENTS,
  INPUT_LENGTHS,
  MODIFIER_HEADER,
  MODIFIER_STRIDE,
} from '#simulation/layout.ts';

/** Build-time only: consumers receive these assembled shaders, never TypeGPU. */
export function compileSimulation() {
  const vertex = readFileSync(new URL('simulation.vert.glsl', import.meta.url), 'utf8');
  const fragmentTemplate = readFileSync(new URL('simulation.frag.glsl', import.meta.url), 'utf8');

  const generatedFunctions = tgpu.resolve([integrate], glOptions());
  const functions = adaptWebGL2(generatedFunctions);

  const fragment = fragmentTemplate.replace('#include <simulation-functions>', () => functions);

  // CPU upload offsets use float32 words. std140 arrays start on vec4 boundaries.
  const layout: Record<string, { offset: number; length: number; padded: number }> = {};
  let words = 0;
  for (const [name, length] of Object.entries(INPUT_LENGTHS)) {
    const padded = Math.ceil(length / 4) * 4;
    layout[name] = { offset: words, length, padded };
    words += padded;
  }

  return {
    vertex,
    fragment,
    arguments: Object.fromEntries(INPUT_ARGUMENTS.map((name) => [name, name])),
    layout,
    words,
    modifierHeader: MODIFIER_HEADER,
    modifierStride: MODIFIER_STRIDE,
  };
}

/**
 * Two compatibility gaps in @typegpu/gl 0.12: it emits a plain uniform struct
 * instead of our std140 block, and uses WGSL's atan2 spelling. Keep these fixes
 * at the build boundary; particle function bodies are never rewritten.
 */
function adaptWebGL2(source: string): string {
  const declaration = 'uniform SimulationData data;';
  if (source.split(declaration).length !== 2) {
    throw new Error('Review TypeGPU uniform declaration before rebuilding shaders');
  }
  const functions = source.replace(
    declaration,
    'layout(std140) uniform SimulationInputs { SimulationData data; };',
  );
  return `float atan2(float y, float x) { return atan(y, x); }\n${functions}`;
}
