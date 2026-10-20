import { strictObject } from 'zod';

import { scalarPropertySchema } from './curve';

export const overLifetimeSchema = strictObject({
  stretchX: scalarPropertySchema.default(0),
  stretchY: scalarPropertySchema.default(0),
  angularVelocity: scalarPropertySchema.default(1),
  rotation: scalarPropertySchema.default(0),
  scale: scalarPropertySchema.default(1),
  alpha: scalarPropertySchema.default(1),
  red: scalarPropertySchema.default(1),
  green: scalarPropertySchema.default(1),
  blue: scalarPropertySchema.default(1),
}).default({
  scale: 1,
  alpha: 1,
  red: 1,
  green: 1,
  blue: 1,
  rotation: 0,
  angularVelocity: 1,
  stretchX: 0,
  stretchY: 0,
});
