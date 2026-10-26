import { z, _default as defaultValue } from 'zod/mini';

import { scalarPropertySchema } from './curve';

export const initialPropertiesSchema = z.strictObject({
  // Lifetime
  lifetime: scalarPropertySchema,
  lifetimeSpread: defaultValue(z.number().check(z.minimum(0)), 0),

  // Motion
  speed: scalarPropertySchema,
  speedSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  direction: z.number(),
  spread: z.number().check(z.minimum(0)),

  // Size
  size: defaultValue(scalarPropertySchema, 24),
  sizeSpread: defaultValue(z.number().check(z.minimum(0)), 0),

  // Rotation and spin
  rotation: defaultValue(scalarPropertySchema, 0),
  rotationSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  angularVelocity: defaultValue(scalarPropertySchema, 0),
  angularVelocitySpread: defaultValue(z.number().check(z.minimum(0)), 0),

  // Stretch
  stretchX: defaultValue(scalarPropertySchema, 0),
  stretchXSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  stretchY: defaultValue(scalarPropertySchema, 0),
  stretchYSpread: defaultValue(z.number().check(z.minimum(0)), 0),

  // Color
  red: defaultValue(scalarPropertySchema, 1),
  redSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  green: defaultValue(scalarPropertySchema, 1),
  greenSpread: defaultValue(z.number().check(z.minimum(0)), 0),
  blue: defaultValue(scalarPropertySchema, 1),
  blueSpread: defaultValue(z.number().check(z.minimum(0)), 0),

  // Opacity
  alpha: defaultValue(scalarPropertySchema, 1),
  alphaSpread: defaultValue(z.number().check(z.minimum(0)), 0),
});
