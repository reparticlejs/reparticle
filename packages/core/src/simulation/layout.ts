/** Shared CPU/shader storage contract. All lengths are float32 words. */
export const CURVE_SEGMENTS = 64;
export const MODIFIER_HEADER = 2;
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
