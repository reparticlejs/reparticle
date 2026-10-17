import type { EmitterConfig, EmitterParameters } from '#types/effect.js';

import { emitterConfigSchema, emitterParametersSchema } from './schema';

/** Validate the complete candidate before replacing runtime settings. */
export function updateEmitterConfig(
  current: EmitterConfig,
  input: EmitterParameters,
): EmitterConfig {
  const patch = emitterParametersSchema.parse(input);
  return emitterConfigSchema.parse({
    ...current,
    emission: {
      ...current.emission,
      ...patch.emission,
      shape: { ...current.emission.shape, ...patch.emission?.shape },
    },
    initial: { ...current.initial, ...patch.initial },
    modifiers: {
      gravity: { ...current.modifiers.gravity, ...patch.modifiers?.gravity },
    },
  });
}
