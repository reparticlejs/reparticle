import type { EmitterConfig, EmitterParameters } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

/** Maps demo settings onto an emitter definition without modifying the original. */
export function applyControls(definition: EmitterConfig, controls: PreviewControls): EmitterConfig {
  const shape: EmitterConfig['emission']['shape'] =
    controls.shape === 'circle'
      ? { type: 'circle', diameter: controls.diameter }
      : { type: 'point' };
  const emission = { ...definition.emission, rate: controls.rate, shape };
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
    shape: definition.emission.shape.type,
    diameter:
      definition.emission.shape.type === 'circle' ? definition.emission.shape.diameter : 100,
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
  const emission: EmitterParameters['emission'] = { rate: controls.rate };
  if (controls.shape === 'circle') {
    emission.shape = { diameter: controls.diameter };
  }
  return {
    emission,
    initial: { lifetime: controls.lifetime },
    modifiers: { gravity: { y: controls.gravity } },
  };
}
