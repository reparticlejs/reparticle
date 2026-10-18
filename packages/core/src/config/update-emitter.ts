import type { EmitterConfig } from '#types/effect.js';

import { emitterConfigSchema, emitterParametersSchema } from './schema';

/** Validate the complete candidate before replacing runtime settings. */
export function updateEmitterConfig(current: EmitterConfig, input: unknown): EmitterConfig {
  const patch = emitterParametersSchema.parse(input);
  return emitterConfigSchema.parse({
    ...current,
    stretchWithVelocity: patch.stretchWithVelocity ?? current.stretchWithVelocity,
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
      vortex: { ...current.modifiers.vortex, ...patch.modifiers?.vortex },
      radial: { ...current.modifiers.radial, ...patch.modifiers?.radial },
      drag: { ...current.modifiers.drag, ...patch.modifiers?.drag },
      acceleration: { ...current.modifiers.acceleration, ...patch.modifiers?.acceleration },
    },
  });
}
