import { z } from 'zod/mini';

import { modifiersSchema } from '../definition/modifiers';
import { emissionSchema } from './emission';
import { initialPropertiesSchema } from './initial-properties';

const positionSchema = z.strictObject({
  x: z.optional(z.number()),
  y: z.optional(z.number()),
});

/** Runtime values and flags; shape type, identity, capacity and seed require recreation. */
export const emitterSchema = z.strictObject({
  // Emitter transform and inherited motion
  position: z.optional(positionSchema),
  rotation: z.optional(z.number()),
  scale: z.optional(z.number()),
  inheritVelocity: z.optional(z.number()),

  // Particle appearance
  stretchWithVelocity: z.optional(z.boolean()),

  // Emission and particle behavior
  emission: z.optional(emissionSchema),
  initial: z.optional(initialPropertiesSchema),
  modifiers: z.optional(modifiersSchema),
});
