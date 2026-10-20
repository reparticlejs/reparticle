import { strictObject } from 'zod';

import { scalarPropertySchema } from './curve';

/** Constants or curves evaluated from particle birth (0) to expiration (1). */
export const overLifetimeSchema = strictObject({
  // Size and stretch
  scale: scalarPropertySchema.default(1),
  stretchX: scalarPropertySchema.default(0),
  stretchY: scalarPropertySchema.default(0),

  // Rotation and spin
  rotation: scalarPropertySchema.default(0),
  angularVelocity: scalarPropertySchema.default(1),

  // Color and opacity
  red: scalarPropertySchema.default(1),
  green: scalarPropertySchema.default(1),
  blue: scalarPropertySchema.default(1),
  alpha: scalarPropertySchema.default(1),
  // Parse an omitted section as an empty object, applying each field's default.
}).prefault({});
