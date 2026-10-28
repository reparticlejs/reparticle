import { readFileSync } from 'node:fs';

import { glOptions } from '@typegpu/gl';
import { tgpu } from 'typegpu';

import { MODIFIER_HEADER, MODIFIER_STRIDE } from '#simulation/data-layout.ts';
import { integrate } from '#simulation/kernels/integrate.ts';

import { createInputLayout } from './input-layout.ts';

const inputs = createInputLayout();

/** Generate GLSL simulation functions and assemble the complete WebGL2 artifact. */
export function compileWebGL2() {
  const generatedFunctions = tgpu.resolve([integrate], glOptions());
  const functions = adaptWebGL2(generatedFunctions);
  const vertex = readShader('webgl2/simulation.vert.glsl');
  const fragment = assembleShader('webgl2/simulation.frag.glsl', functions);

  return {
    vertex,
    fragment,
    arguments: inputs.arguments,
    layout: inputs.layout,
    words: inputs.words,
    modifierHeader: MODIFIER_HEADER,
    modifierStride: MODIFIER_STRIDE,
  };
}

/** Generate native WGSL simulation functions and assemble the complete WebGPU artifact. */
export function compileWebGPU() {
  const functions = tgpu.resolve([integrate]);
  const source = assembleShader('webgpu/simulation.wgsl', functions);

  return {
    source,
    layout: inputs.layout,
    words: inputs.words,
    arguments: inputs.arguments,
  };
}

function readShader(filename: string): string {
  return readFileSync(new URL(filename, import.meta.url), 'utf8');
}

/** Insert generated functions into the authored storage and entry-point wrapper. */
function assembleShader(filename: string, functions: string): string {
  return readShader(filename).replace('#include <simulation-functions>', () => functions);
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
