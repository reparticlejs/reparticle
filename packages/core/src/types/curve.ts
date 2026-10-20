import type { z } from 'zod';

import type { curveSchema, scalarPropertySchema } from '../config/schemas/definition/curve';

export type Curve = z.infer<typeof curveSchema>;
export type CurvePoint = Curve['points'][number];
export type ScalarProperty = z.infer<typeof scalarPropertySchema>;
