import { z, _default as defaultValue } from 'zod/mini';

import { scalarPropertySchema } from './curve';

const accelerationSchema = z.strictObject({
  magnitude: defaultValue(scalarPropertySchema, 0),
  spread: defaultValue(z.number().check(z.minimum(0)), 0),
  rotation: defaultValue(z.number(), 0),
});

const vortexSchema = z.strictObject({
  rotation: defaultValue(z.number(), 0),
  magnitude: defaultValue(scalarPropertySchema, 0),
  spread: defaultValue(z.number().check(z.minimum(0)), 0),
  x: defaultValue(z.number(), 0),
  y: defaultValue(z.number(), 0),
  maxDistance: defaultValue(z.number().check(z.minimum(0)), 100),
});

const radialSchema = z.strictObject({
  magnitude: defaultValue(scalarPropertySchema, 0),
  spread: defaultValue(z.number().check(z.minimum(0)), 0),
  x: defaultValue(z.number(), 0),
  y: defaultValue(z.number(), 0),
  maxDistance: defaultValue(z.number().check(z.minimum(0)), 100),
});

const dragSchema = z.strictObject({
  magnitude: defaultValue(scalarPropertySchema, 0),
  spread: defaultValue(z.number().check(z.minimum(0)), 0),
  useDirection: defaultValue(z.boolean(), false),
  rotation: defaultValue(z.number(), 0),
});

export const modifierSchema = z.discriminatedUnion('type', [
  z.extend(accelerationSchema, { type: z.literal('acceleration') }),
  z.extend(dragSchema, { type: z.literal('drag') }),
  z.extend(radialSchema, { type: z.literal('radial') }),
  z.extend(vortexSchema, { type: z.literal('vortex') }),
]);

/** Each scope permits 64 modifiers; the GPU applies at most 128 in one pass. */
export const modifiersSchema = z.array(modifierSchema).check(z.maxLength(64));
