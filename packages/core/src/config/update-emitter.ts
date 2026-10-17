import type { EmitterConfig } from '#types/effect.js';

import { emitterConfigSchema, emitterParametersSchema } from './schema';

/** Validate the complete candidate before replacing runtime settings. */
export function updateEmitterConfig(current: EmitterConfig, input: unknown): EmitterConfig {
  const patch = emitterParametersSchema.parse(input);
  return emitterConfigSchema.parse({
    ...current,
    scale: patch.scale ?? current.scale,
    rotation: patch.rotation ?? current.rotation,
    inheritVelocity: patch.inheritVelocity ?? current.inheritVelocity,
    emission: {
      ...current.emission,
      ...patch.emission,
      shape: { ...current.emission.shape, ...patch.emission?.shape },
    },
    initial: { ...current.initial, ...patch.initial },
    modifiers: {
      drag: { ...current.modifiers.drag, ...patch.modifiers?.drag },
      gravity: { ...current.modifiers.gravity, ...patch.modifiers?.gravity },
    },
  });
}
