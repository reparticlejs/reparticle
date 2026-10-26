import { emitterConfigSchema } from '#config/schemas/definition/emitter.js';
import { emitterSchema } from '#config/schemas/runtime/emitter.js';
import type { EmitterConfig } from '#types/effect.js';

/** Validate the complete candidate before replacing runtime settings. */
export function mergeEmitterParameters(current: EmitterConfig, input: unknown): EmitterConfig {
  const patch = emitterSchema.parse(input);

  const position = { ...current.position, ...patch.position };
  const initial = { ...current.initial, ...patch.initial };
  const shape = { ...current.emission.shape, ...patch.emission?.shape };
  const emission = { ...current.emission, ...patch.emission, shape };

  const updated = {
    ...current,

    position,
    rotation: patch.rotation ?? current.rotation,
    scale: patch.scale ?? current.scale,
    inheritVelocity: patch.inheritVelocity ?? current.inheritVelocity,

    stretchWithVelocity: patch.stretchWithVelocity ?? current.stretchWithVelocity,

    emission,
    initial,
    modifiers: patch.modifiers ?? current.modifiers,
  };

  return emitterConfigSchema.parse(updated);
}
