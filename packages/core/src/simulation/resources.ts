import { tgpu, d } from 'typegpu';

import { CURVE_SEGMENTS, MODIFIER_WORDS } from './layout.ts';
export { readSpawn, readState } from './storage.ts';

// Field order and vec4 packing match core's 5,360-byte SimulationInputs block.
const SimulationData = d
  .struct({
    stepInput: d.vec4f,
    emissionInput: d.vec4f,
    shapeInput: d.vec4f,
    shapeSpreadInput: d.vec4f,
    appearanceInput: d.vec4f,
    colorInput: d.vec4f,
    motionSpreadInput: d.vec4f,
    colorSpreadInput: d.vec4f,
    geometrySpreadInput: d.vec4f,
    positionInput: d.vec4f,
    transformInput: d.vec4f,
    orientationInput: d.vec4f,
    rotationCurve: d.arrayOf(d.vec4f, Math.ceil((CURVE_SEGMENTS + 1) / 4)),
    angularVelocityCurve: d.arrayOf(d.vec4f, Math.ceil((CURVE_SEGMENTS + 1) / 4)),
    modifiers: d.arrayOf(d.vec4f, Math.ceil(MODIFIER_WORDS / 4)),
  })
  .$name('SimulationData');
const inputs = tgpu.bindGroupLayout({ data: { uniform: SimulationData } });
// Pass a curve selector, never the array. Read only the scalar being sampled.
export const readCurve = tgpu.fn(
  [d.f32, d.f32],
  d.f32,
)((curve, index) => {
  'use gpu';
  const word = d.i32(index);
  if (curve < 0.5) {
    return inputs.$.data.rotationCurve[d.i32(word / 4)]![word % 4]!;
  }
  return inputs.$.data.angularVelocityCurve[d.i32(word / 4)]![word % 4]!;
});
// Read modifier fields directly; never copy the full array into a local value.
export const readModifier = tgpu.fn(
  [d.f32],
  d.f32,
)((index) => {
  'use gpu';
  const word = d.i32(index);
  return inputs.$.data.modifiers[d.i32(word / 4)]![word % 4]!;
});
