/**
 * Storage conventions shared by CPU input packing and generated simulation shaders.
 * Sizes count float32 words (4 bytes each), not bytes or particles.
 *
 * The shader compiler uses these lengths to generate uniform-buffer offsets.
 * Changing a layout requires updating its writers/readers and regenerating shaders.
 * This file describes storage; it does not define authored effect settings.
 */

/** 64 intervals require 65 curve samples, including both endpoints. */
export const CURVE_SEGMENTS = 64;
/** Two leading words: active record count, then whether any active modifier is radial. */
export const MODIFIER_HEADER = 2;
/** Number of active records; trailing records are ignored and need not be cleared. */
export const MODIFIER_COUNT_INDEX = 0;
/** Nonzero when radial forces need the particle heading as a center-point fallback. */
export const MODIFIER_RADIAL_FLAG_INDEX = 1;
/**
 * Words per modifier: type, magnitude, spread, center X/Y, direction X/Y,
 * distance cutoff, and directional-drag flag. Keep the writer and dispatch reader aligned.
 */
export const MODIFIER_STRIDE = 9;
/** Up to 64 emitter modifiers followed by 64 effect modifiers, in authored order. */
export const MAX_MODIFIERS = 128;
/** Total modifier storage, including its header and all available records. */
export const MODIFIER_WORDS = MODIFIER_HEADER + MODIFIER_STRIDE * MAX_MODIFIERS;

/**
 * Order of the runtime's SimulationInputs.args array. The compiler preserves it
 * in generated binding metadata; particle-simulation uses those indexes to read inputs.
 * This includes textures, whose storage is separate from the uniform buffer.
 * Keep names and order aligned with the runtime packer and shader wrapper.
 */
export const INPUT_ARGUMENTS = [
  'state',
  'stepInput',
  'emissionInput',
  'shapeInput',
  'shapeSpreadInput',
  'appearanceInput',
  'colorInput',
  'motionSpreadInput',
  'colorSpreadInput',
  'geometrySpreadInput',
  'positionInput',
  'transformInput',
  'orientationInput',
  'spawnMask',
  'rotationCurve',
  'angularVelocityCurve',
  'modifiers',
] as const;

/**
 * Unpadded word counts for uniform-buffer inputs, in declaration order.
 * Each ordinary input is one vec4. Curves and modifiers contain scalar words
 * packed into vec4 arrays; the compiler rounds their storage up to multiples of four.
 * Keep this order aligned with SimulationData in resources.ts and the GLSL wrapper.
 * Texture inputs (state and spawnMask) have no entry here.
 */
export const INPUT_LENGTHS = {
  stepInput: 4,
  emissionInput: 4,
  shapeInput: 4,
  shapeSpreadInput: 4,
  appearanceInput: 4,
  colorInput: 4,
  motionSpreadInput: 4,
  colorSpreadInput: 4,
  geometrySpreadInput: 4,
  positionInput: 4,
  transformInput: 4,
  orientationInput: 4,
  rotationCurve: CURVE_SEGMENTS + 1,
  angularVelocityCurve: CURVE_SEGMENTS + 1,
  modifiers: MODIFIER_WORDS,
} as const;

/**
 * Logical RGBA bands returned by readState. A band's texel row is
 * particleRow + band * rows, where rows is the number of particle rows per band.
 * storage.ts reconstructs these from two changing-state bands and three birth bands;
 * these numbers are not physical offsets into either texture.
 * Keep the mapping aligned with storage.ts and the GLSL pass outputs.
 */
export const PARTICLE_BAND = {
  /** Position X/Y and velocity X/Y. */
  motion: 0,
  /** Age, lifetime, initial size, and initial rotation. */
  properties: 1,
  /** Initial red, green, blue, and alpha. */
  color: 2,
  /** Active flag, modifier variation, initial angular velocity, and accumulated rotation. */
  dynamics: 3,
  /** Initial stretch X/Y, handedness, and movement heading. */
  geometry: 4,
} as const;
