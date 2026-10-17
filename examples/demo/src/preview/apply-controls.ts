import type { EmitterConfig } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

/** Maps demo settings onto an emitter definition without modifying the original. */
export function applyControls(definition: EmitterConfig, controls: PreviewControls): EmitterConfig {
  const emission = { ...definition.emission, rate: controls.rate };
  const initial = { ...definition.initial, lifetime: controls.lifetime };
  const gravity = { ...definition.modifiers.gravity, y: controls.gravity };

  return {
    ...definition,
    capacity: controls.capacity,
    emission,
    initial,
    modifiers: { ...definition.modifiers, gravity },
  };
}
