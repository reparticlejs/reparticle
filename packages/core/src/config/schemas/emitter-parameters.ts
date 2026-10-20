import { boolean, number, strictObject } from 'zod';

import { emissionParametersSchema } from './emission';
import { blendModeSchema } from './emitter';
import { initialParametersSchema } from './initial-properties';
import { modifiersSchema } from './modifiers';

/** Runtime values and flags; shape type, identity, capacity and seed require recreation. */
export const emitterParametersSchema = strictObject({
  blendMode: blendModeSchema.optional(),
  stretchWithVelocity: boolean().optional(),
  position: strictObject({ x: number().optional(), y: number().optional() }).optional(),
  scale: number().optional(),
  rotation: number().optional(),
  inheritVelocity: number().optional(),
  emission: emissionParametersSchema.optional(),
  initial: initialParametersSchema.optional(),
  modifiers: modifiersSchema.optional(),
});
