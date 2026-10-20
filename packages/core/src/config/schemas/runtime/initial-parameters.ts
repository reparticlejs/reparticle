import { number, strictObject } from 'zod';

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
