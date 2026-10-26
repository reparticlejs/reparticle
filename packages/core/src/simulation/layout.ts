/** Shared CPU/shader storage contract. All lengths are float32 words. */
export const CURVE_SEGMENTS = 64;
export const MODIFIER_HEADER = 2;
/** Header fields shared by the runtime writer and sampler. */
export const MODIFIER_COUNT_INDEX = 0;
export const MODIFIER_RADIAL_FLAG_INDEX = 1;
export const MODIFIER_STRIDE = 9;
export const MAX_MODIFIERS = 128;
export const MODIFIER_WORDS = MODIFIER_HEADER + MODIFIER_STRIDE * MAX_MODIFIERS;

/** Order matches SimulationInputs.args; textures do not occupy uniform words. */
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

/** Logical bands exposed by readState; physical state and birth textures are split. */
export const PARTICLE_BAND = {
  motion: 0,
  properties: 1,
  color: 2,
  dynamics: 3,
  geometry: 4,
} as const;
