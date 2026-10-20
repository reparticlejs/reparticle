import { array, number, strictObject, union } from 'zod';

const pointSchema = strictObject({
  time: number().min(0).max(1),
  value: number(),
  // Slope dy/dx of the curve at this point.
  tangent: number().default(0),
});

export const curveSchema = strictObject({
  points: array(pointSchema)
    .min(1)
    .refine(
      (points) =>
        points.every((point, index) => index === 0 || point.time > points[index - 1]!.time),
      'Curve points must have strictly increasing times',
    ),
});

export const scalarPropertySchema = union([number(), curveSchema]);
