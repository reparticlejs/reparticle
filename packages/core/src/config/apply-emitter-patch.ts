import type { EmitterConfig } from '#types/effect.js';

import { emitterConfigSchema } from './schemas/definition/emitter';
import { emitterSchema } from './schemas/runtime/emitter';

/** Validate the complete candidate before replacing runtime settings. */
export function applyEmitterPatch(current: EmitterConfig, input: unknown): EmitterConfig {
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
    blendMode: patch.blendMode ?? current.blendMode,

    emission,
    initial,
    modifiers: patch.modifiers ?? current.modifiers,
  };

  return emitterConfigSchema.parse(updated);
}
