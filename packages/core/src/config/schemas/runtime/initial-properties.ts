import { z } from 'zod/mini';

export const initialPropertiesSchema = z
  .partial(
    z.strictObject({
      // Lifetime
      lifetime: z.number(),
      lifetimeSpread: z.number().check(z.minimum(0)),

      // Motion
      speed: z.number(),
      speedSpread: z.number().check(z.minimum(0)),
      direction: z.number(),
      spread: z.number().check(z.minimum(0)),

      // Size
      size: z.number(),
      sizeSpread: z.number().check(z.minimum(0)),

      // Rotation and spin
      rotation: z.number(),
      rotationSpread: z.number().check(z.minimum(0)),
      angularVelocity: z.number(),
      angularVelocitySpread: z.number().check(z.minimum(0)),

      // Stretch
      stretchX: z.number(),
      stretchXSpread: z.number().check(z.minimum(0)),
      stretchY: z.number(),
      stretchYSpread: z.number().check(z.minimum(0)),

      // Color
      red: z.number(),
      redSpread: z.number().check(z.minimum(0)),
      green: z.number(),
      greenSpread: z.number().check(z.minimum(0)),
      blue: z.number(),
      blueSpread: z.number().check(z.minimum(0)),

      // Opacity
      alpha: z.number(),
      alphaSpread: z.number().check(z.minimum(0)),
    }),
  )
  .check(
    z.refine(
      (patch) => Object.values(patch).every((value) => value !== undefined),
      'Initial parameter values must be numbers',
    ),
  );
