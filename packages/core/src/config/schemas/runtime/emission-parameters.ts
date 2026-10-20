import { number, strictObject } from 'zod';

// Runtime patches change dimensions without changing the emitter's shape type.
const shapeParametersSchema = strictObject({
  diameter: number(),
  diameterSpread: number().nonnegative(),
  width: number(),
  widthSpread: number().nonnegative(),
  height: number(),
  heightSpread: number().nonnegative(),
}).partial();

export const emissionParametersSchema = strictObject({
  rate: number().nonnegative(),
  shape: shapeParametersSchema,
}).partial();
