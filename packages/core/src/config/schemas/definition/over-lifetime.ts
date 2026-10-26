import { z, _default as defaultValue } from 'zod/mini';

import { scalarPropertySchema } from './curve';

/** Constants or curves evaluated from particle birth (0) to expiration (1). */
export const overLifetimeSchema = z.prefault(
  z.strictObject({
    // Size and stretch
    scale: defaultValue(scalarPropertySchema, 1),
    stretchX: defaultValue(scalarPropertySchema, 0),
    stretchY: defaultValue(scalarPropertySchema, 0),

    // Rotation and spin
    rotation: defaultValue(scalarPropertySchema, 0),
    angularVelocity: defaultValue(scalarPropertySchema, 1),

    // Color and opacity
    red: defaultValue(scalarPropertySchema, 1),
    green: defaultValue(scalarPropertySchema, 1),
    blue: defaultValue(scalarPropertySchema, 1),
    alpha: defaultValue(scalarPropertySchema, 1),
    // Parse an omitted section as an empty object, applying each field's default.
  }),
  {},
);
