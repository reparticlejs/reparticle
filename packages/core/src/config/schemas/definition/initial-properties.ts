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
