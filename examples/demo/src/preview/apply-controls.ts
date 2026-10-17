import type { EmitterConfig, EmitterParameters } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

/** Maps demo settings onto an emitter definition without modifying the original. */
export function applyControls(definition: EmitterConfig, controls: PreviewControls): EmitterConfig {
  const shape = emitterShape(controls);
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
    width: definition.emission.shape.type === 'box' ? definition.emission.shape.width : 200,
    height: definition.emission.shape.type === 'box' ? definition.emission.shape.height : 100,
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
  } else if (controls.shape === 'box') {
    emission.shape = { width: controls.width, height: controls.height };
  }
  return {
    emission,
    initial: { lifetime: controls.lifetime },
    modifiers: { gravity: { y: controls.gravity } },
  };
}

function emitterShape(controls: PreviewControls): EmitterConfig['emission']['shape'] {
  switch (controls.shape) {
    case 'circle':
      return { type: 'circle', diameter: controls.diameter };
    case 'box':
      return { type: 'box', width: controls.width, height: controls.height };
    case 'point':
      return { type: 'point' };
    default:
      throw new Error(`Unsupported emitter shape: ${String(controls.shape satisfies never)}`);
  }
}
