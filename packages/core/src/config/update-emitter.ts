import type { EmitterConfig } from '#types/effect.js';

import { emitterConfigSchema } from './schemas/emitter';
import { emitterParametersSchema } from './schemas/emitter-parameters';

/** Validate the complete candidate before replacing runtime settings. */
export function updateEmitterConfig(current: EmitterConfig, input: unknown): EmitterConfig {
  const patch = emitterParametersSchema.parse(input);
  return emitterConfigSchema.parse({
    ...current,
    blendMode: patch.blendMode ?? current.blendMode,
    stretchWithVelocity: patch.stretchWithVelocity ?? current.stretchWithVelocity,
    position: { ...current.position, ...patch.position },
    scale: patch.scale ?? current.scale,
    rotation: patch.rotation ?? current.rotation,
    inheritVelocity: patch.inheritVelocity ?? current.inheritVelocity,
    emission: {
      ...current.emission,
      ...patch.emission,
      shape: { ...current.emission.shape, ...patch.emission?.shape },
    },
    initial: { ...current.initial, ...patch.initial },
    modifiers: patch.modifiers ?? current.modifiers,
  });
}
