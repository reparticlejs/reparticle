import { number, strictObject } from 'zod';

import { scalarPropertySchema } from './curve';

export const initialPropertiesSchema = strictObject({
  // Lifetime
  lifetime: scalarPropertySchema,
  lifetimeSpread: number().nonnegative().default(0),

  // Motion
  speed: scalarPropertySchema,
  speedSpread: number().nonnegative().default(0),
  direction: number(),
  spread: number().nonnegative(),

  // Size
  size: scalarPropertySchema.default(24),
  sizeSpread: number().nonnegative().default(0),

  // Rotation and spin
  rotation: scalarPropertySchema.default(0),
  rotationSpread: number().nonnegative().default(0),
  angularVelocity: scalarPropertySchema.default(0),
  angularVelocitySpread: number().nonnegative().default(0),

  // Stretch
  stretchX: scalarPropertySchema.default(0),
  stretchXSpread: number().nonnegative().default(0),
  stretchY: scalarPropertySchema.default(0),
  stretchYSpread: number().nonnegative().default(0),

  // Color
  red: scalarPropertySchema.default(1),
  redSpread: number().nonnegative().default(0),
  green: scalarPropertySchema.default(1),
  greenSpread: number().nonnegative().default(0),
  blue: scalarPropertySchema.default(1),
  blueSpread: number().nonnegative().default(0),

  // Opacity
  alpha: scalarPropertySchema.default(1),
  alphaSpread: number().nonnegative().default(0),
});
