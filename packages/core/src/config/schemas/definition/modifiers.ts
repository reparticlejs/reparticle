import { array, boolean, discriminatedUnion, literal, number, strictObject } from 'zod';

import { scalarPropertySchema } from './curve';

const accelerationSchema = strictObject({
  magnitude: scalarPropertySchema.default(0),
  spread: number().nonnegative().default(0),
  rotation: number().default(0),
});

const vortexSchema = strictObject({
  rotation: number().default(0),
  magnitude: scalarPropertySchema.default(0),
  spread: number().nonnegative().default(0),
  x: number().default(0),
  y: number().default(0),
  maxDistance: number().nonnegative().default(100),
});

const radialSchema = strictObject({
  magnitude: scalarPropertySchema.default(0),
  spread: number().nonnegative().default(0),
  x: number().default(0),
  y: number().default(0),
  maxDistance: number().nonnegative().default(100),
});

const dragSchema = strictObject({
  magnitude: scalarPropertySchema.default(0),
  spread: number().nonnegative().default(0),
  useDirection: boolean().default(false),
  rotation: number().default(0),
});

export const modifierSchema = discriminatedUnion('type', [
  accelerationSchema.extend({ type: literal('acceleration') }),
  dragSchema.extend({ type: literal('drag') }),
  radialSchema.extend({ type: literal('radial') }),
  vortexSchema.extend({ type: literal('vortex') }),
]);

/** Each scope permits 64 modifiers; the GPU applies at most 128 in one pass. */
export const modifiersSchema = array(modifierSchema).max(64);
