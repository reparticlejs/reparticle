import { number, strictObject } from 'zod';

// Runtime patches change dimensions without changing the emitter's shape type.
const shapeSchema = strictObject({
  diameter: number(),
  diameterSpread: number().nonnegative(),
  width: number(),
  widthSpread: number().nonnegative(),
  height: number(),
  heightSpread: number().nonnegative(),
}).partial();

export const emissionSchema = strictObject({
  rate: number().nonnegative(),
  rateOverDistance: number().nonnegative(),
  shape: shapeSchema,
}).partial();
