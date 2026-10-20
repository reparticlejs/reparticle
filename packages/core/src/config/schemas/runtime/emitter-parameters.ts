import { boolean, number, strictObject } from 'zod';

import { blendModeSchema } from '../definition/emitter';
import { modifiersSchema } from '../definition/modifiers';
import { emissionParametersSchema } from './emission-parameters';
import { initialParametersSchema } from './initial-parameters';

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
