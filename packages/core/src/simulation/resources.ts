import { tgpu, d } from 'typegpu';

import { CURVE_SEGMENTS, MODIFIER_WORDS } from './data-layout.ts';
export { readSpawn, readState } from './storage.ts';

/**
 * Shader-side view of the CPU-packed simulation inputs.
 *
 * Field order must match INPUT_LENGTHS in data-layout.ts and the GLSL wrapper.
 * Scalar arrays are stored as vec4 arrays for std140 alignment: each vec4 holds
 * four consecutive words, with unused lanes at the end of each array.
 * Changing this declaration requires rebuilding the generated shader.
 */
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
/**
 * Build-time binding used by TypeGPU to emit uniform reads.
 * compile.ts places the generated declaration in the SimulationInputs block;
 * the WebGL runtime uploads and binds that block for the current emitter.
 * This declaration does not allocate a runtime GPU buffer.
 */
const inputs = tgpu.bindGroupLayout({ data: { uniform: SimulationData } });

/**
 * Read one sample from a packed lifetime curve: 0 selects rotation, 1 angular velocity.
 * index is a sample index, not normalized time; callers interpolate between samples.
 * Callers must keep it within 0..CURVE_SEGMENTS. Padding is not a valid sample.
 * A selector avoids passing or copying the full curve array into shader functions.
 */
export const readCurve = tgpu.fn(
  [d.f32, d.f32],
  d.f32,
)((curve, index) => {
  'use gpu';
  // Integer division selects the vec4; the remainder selects its component.
  const word = d.i32(index);
  if (curve < 0.5) {
    return inputs.$.data.rotationCurve[d.i32(word / 4)]![word % 4]!;
  }
  return inputs.$.data.angularVelocityCurve[d.i32(word / 4)]![word % 4]!;
});

/**
 * Read a word from the packed modifier header or a modifier record.
 * Record offsets are MODIFIER_HEADER + recordIndex * MODIFIER_STRIDE.
 * Callers use the active count to stay within valid records; this reader does not
 * clamp indexes or interpret fields. Read directly to avoid copying the full array.
 */
export const readModifier = tgpu.fn(
  [d.f32],
  d.f32,
)((index) => {
  'use gpu';
  const word = d.i32(index);
  return inputs.$.data.modifiers[d.i32(word / 4)]![word % 4]!;
});
