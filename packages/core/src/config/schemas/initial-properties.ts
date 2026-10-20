import { number, strictObject } from 'zod';

import { scalarPropertySchema } from './curve';

export const initialPropertiesSchema = strictObject({
  lifetime: scalarPropertySchema,
  lifetimeSpread: number().nonnegative().default(0),
  speed: scalarPropertySchema,
  speedSpread: number().nonnegative().default(0),
  direction: number(),
  spread: number().nonnegative(),
  size: scalarPropertySchema.default(24),
  sizeSpread: number().nonnegative().default(0),
  rotation: scalarPropertySchema.default(0),
  rotationSpread: number().nonnegative().default(0),
  angularVelocity: scalarPropertySchema.default(0),
  angularVelocitySpread: number().nonnegative().default(0),
  stretchX: scalarPropertySchema.default(0),
  stretchXSpread: number().nonnegative().default(0),
  stretchY: scalarPropertySchema.default(0),
  stretchYSpread: number().nonnegative().default(0),
  red: scalarPropertySchema.default(1),
  redSpread: number().nonnegative().default(0),
  green: scalarPropertySchema.default(1),
  greenSpread: number().nonnegative().default(0),
  blue: scalarPropertySchema.default(1),
  blueSpread: number().nonnegative().default(0),
  alpha: scalarPropertySchema.default(1),
  alphaSpread: number().nonnegative().default(0),
});

export const initialParametersSchema = strictObject({
  lifetime: number(),
  lifetimeSpread: number().nonnegative(),
  speed: number(),
  speedSpread: number().nonnegative(),
  direction: number(),
  spread: number().nonnegative(),
  size: number(),
  sizeSpread: number().nonnegative(),
  rotation: number(),
  rotationSpread: number().nonnegative(),
  angularVelocity: number(),
  angularVelocitySpread: number().nonnegative(),
  stretchX: number(),
  stretchXSpread: number().nonnegative(),
  stretchY: number(),
  stretchYSpread: number().nonnegative(),
  red: number(),
  redSpread: number().nonnegative(),
  green: number(),
  greenSpread: number().nonnegative(),
  blue: number(),
  blueSpread: number().nonnegative(),
  alpha: number(),
  alphaSpread: number().nonnegative(),
})
  .partial()
  .refine(
    (patch) => Object.values(patch).every((value) => value !== undefined),
    'Initial parameter values must be numbers',
  );
