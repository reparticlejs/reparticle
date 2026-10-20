import { number, strictObject } from 'zod';

export const initialPropertiesSchema = strictObject({
  // Lifetime
  lifetime: number(),
  lifetimeSpread: number().nonnegative(),

  // Motion
  speed: number(),
  speedSpread: number().nonnegative(),
  direction: number(),
  spread: number().nonnegative(),

  // Size
  size: number(),
  sizeSpread: number().nonnegative(),

  // Rotation and spin
  rotation: number(),
  rotationSpread: number().nonnegative(),
  angularVelocity: number(),
  angularVelocitySpread: number().nonnegative(),

  // Stretch
  stretchX: number(),
  stretchXSpread: number().nonnegative(),
  stretchY: number(),
  stretchYSpread: number().nonnegative(),

  // Color
  red: number(),
  redSpread: number().nonnegative(),
  green: number(),
  greenSpread: number().nonnegative(),
  blue: number(),
  blueSpread: number().nonnegative(),

  // Opacity
  alpha: number(),
  alphaSpread: number().nonnegative(),
})
  .partial()
  .refine(
    (patch) => Object.values(patch).every((value) => value !== undefined),
    'Initial parameter values must be numbers',
  );
