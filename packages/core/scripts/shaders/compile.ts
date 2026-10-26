import { glOptions } from '@typegpu/gl';
import { tgpu } from 'typegpu';

import { integrate } from '../../src/simulation/kernels/integrate.ts';
import {
  INPUT_ARGUMENTS,
  INPUT_LENGTHS,
  MODIFIER_HEADER,
  MODIFIER_STRIDE,
} from '../../src/simulation/layout.ts';

/**
 * Resolve authored TypeScript through TypeGPU's public WebGL2 generator.
 * Resource binding and framebuffer passes below belong to our native runtime;
 * particle behavior is generated without rewriting function bodies.
 */
export function compileSimulation() {
  let helpers = tgpu.resolve([integrate], glOptions());
  // @typegpu/gl 0.12 emits a plain uniform struct. Our runtime uploads one
  // std140 buffer, so adapt only its declaration. Fail on upstream changes.
  const declaration = 'uniform SimulationData data;';
  if (helpers.split(declaration).length !== 2) {
    throw new Error('Review TypeGPU uniform declaration before rebuilding shaders');
  }
  helpers = helpers.replace(
    declaration,
    'layout(std140) uniform SimulationInputs { SimulationData data; };',
  );

  const layout: Record<string, { offset: number; length: number; padded: number }> = {};
  let words = 0;
  for (const [name, length] of Object.entries(INPUT_LENGTHS)) {
    const padded = Math.ceil(length / 4) * 4;
    layout[name] = { offset: words, length, padded };
    words += padded;
  }
  const vectors = Object.entries(INPUT_LENGTHS)
    .filter(([, length]) => length === 4)
    .map(([name]) => `data.${name}`);
  const fragment = `#version 300 es
precision highp float;
precision highp int;
// Float textures contain simulation data, including 24-bit spawn masks.
// Sampler precision is independent of the default float precision.
precision highp sampler2D;
// The experimental GLSL generator currently preserves WGSL's atan2 spelling.
float atan2(float y, float x) { return atan(y, x); }
${helpers}
uniform sampler2D user_state;
uniform sampler2D user_spawnMask;
uniform sampler2D birthState;
uniform int birthPass;
uniform int constants_width;
uniform int constants_rows;
uniform int constants_capacity;
layout(location=0) out vec4 result;

// Curve selectors (0/1) avoid passing whole arrays through GLSL functions.
vec4 evaluate(int x, int y) {
  return integrate(user_state, ${vectors.join(', ')}, user_spawnMask,
    0.0, 1.0, float(x), float(y), float(constants_width),
    float(constants_rows), float(constants_capacity), birthState, float(birthPass));
}

void main() {
  int x = int(gl_FragCoord.x);
  int row = int(gl_FragCoord.y) % constants_rows;
  int band = int(gl_FragCoord.y) / constants_rows;
  if (birthPass == 1) {
    int slot = row * constants_width + x;
    float mask = readSpawn(user_spawnMask, float(slot / 24));
    // Discard leaves existing birth data untouched for slots not being recycled.
    if (slot >= constants_capacity || data.stepInput.y <= 0.0 ||
        mod(floor(mask / pow(2.0, float(slot % 24))), 2.0) <= 0.5) discard;
    if (band == 1) result = evaluate(x, row + constants_rows * 2);
    else if (band == 0) {
      vec3 properties = evaluate(x, row + constants_rows).yzw;
      result = vec4(properties, evaluate(x, row + constants_rows * 3).y);
    } else {
      float angular = evaluate(x, row + constants_rows * 3).z;
      result = vec4(angular, evaluate(x, row + constants_rows * 4).xyz);
    }
  } else if (band == 0) result = evaluate(x, row);
  else {
    float age = evaluate(x, row + constants_rows).x;
    vec2 dynamics = evaluate(x, row + constants_rows * 3).xw;
    result = vec4(age, dynamics, evaluate(x, row + constants_rows * 4).w);
  }
}
`;
  return {
    fragment,
    arguments: Object.fromEntries(INPUT_ARGUMENTS.map((name) => [name, name])),
    layout,
    words,
    modifierHeader: MODIFIER_HEADER,
    modifierStride: MODIFIER_STRIDE,
  };
}
