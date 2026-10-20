import { boolean, number, strictObject } from 'zod';

import { blendModeSchema } from '../definition/emitter';
import { modifiersSchema } from '../definition/modifiers';
import { emissionSchema } from './emission';
import { initialPropertiesSchema } from './initial-properties';

const positionSchema = strictObject({
  x: number().optional(),
  y: number().optional(),
});

/** Runtime values and flags; shape type, identity, capacity and seed require recreation. */
export const emitterSchema = strictObject({
  // Emitter transform and inherited motion
  position: positionSchema.optional(),
  rotation: number().optional(),
  scale: number().optional(),
  inheritVelocity: number().optional(),

  // Particle appearance
  stretchWithVelocity: boolean().optional(),
  blendMode: blendModeSchema.optional(),

  // Emission and particle behavior
  emission: emissionSchema.optional(),
  initial: initialPropertiesSchema.optional(),
  modifiers: modifiersSchema.optional(),
});
