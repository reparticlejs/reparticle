import type { EmitterConfig, EmitterParameters } from '@reparticle/core';

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

export function initialControls(definition: EmitterConfig): PreviewControls {
  return {
    capacity: definition.capacity,
    rate: definition.emission.rate,
    gravity: definition.modifiers.gravity.y,
    lifetime: definition.initial.lifetime,
    texture: 'star',
    size: 24,
    paused: false,
    statsVisible: true,
  };
}

export function emitterParameters(controls: PreviewControls): EmitterParameters {
  return {
    emission: { rate: controls.rate },
    initial: { lifetime: controls.lifetime },
    modifiers: { gravity: { y: controls.gravity } },
  };
}
