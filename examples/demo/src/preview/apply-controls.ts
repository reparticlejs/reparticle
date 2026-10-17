import type { EmitterConfig, EmitterParameters } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';
import { sizeCurves } from './size-curves';

/** Maps demo settings onto an emitter definition without modifying the original. */
export function applyControls(definition: EmitterConfig, controls: PreviewControls): EmitterConfig {
  const shape = emitterShape(controls);
  const emission = { ...definition.emission, rate: controls.rate, shape };
  const initial = { ...definition.initial, lifetime: controls.lifetime, size: controls.size };
  const gravity = { ...definition.modifiers.gravity, y: controls.gravity };

  return {
    ...definition,
    capacity: controls.capacity,
    startOffset: controls.startOffset,
    startDelay: controls.startDelay,
    duration: controls.duration,
    playMode: controls.playMode,
    emission,
    initial,
    overLifetime: {
      scale:
        controls.sizeCurve === 'effect'
          ? definition.overLifetime.scale
          : sizeCurves[controls.sizeCurve],
    },
    modifiers: { ...definition.modifiers, gravity },
  };
}

export function initialControls(definition: EmitterConfig): PreviewControls {
  const shape = definition.emission.shape;
  return {
    capacity: definition.capacity,
    startOffset: definition.startOffset,
    startDelay: definition.startDelay,
    duration: definition.duration,
    playMode: definition.playMode,
    shape: definition.emission.shape.type,
    diameter:
      definition.emission.shape.type === 'circle' ? definition.emission.shape.diameter : 100,
    width: 'width' in shape ? shape.width : 200,
    height: 'height' in shape ? shape.height : 100,
    rate: definition.emission.rate,
    gravity: definition.modifiers.gravity.y,
    lifetime: definition.initial.lifetime,
    texture: 'star',
    size: definition.initial.size,
    sizeCurve: 'effect',
    paused: false,
    statsVisible: true,
  };
}

export function emitterParameters(controls: PreviewControls): EmitterParameters {
  const emission: EmitterParameters['emission'] = { rate: controls.rate };
  if (controls.shape === 'circle') {
    emission.shape = { diameter: controls.diameter };
  } else if (controls.shape === 'box' || controls.shape === 'cone2d') {
    emission.shape = { width: controls.width, height: controls.height };
  }
  return {
    emission,
    initial: { lifetime: controls.lifetime, size: controls.size },
    modifiers: { gravity: { y: controls.gravity } },
  };
}

function emitterShape(controls: PreviewControls): EmitterConfig['emission']['shape'] {
  switch (controls.shape) {
    case 'circle':
      return { type: 'circle', diameter: controls.diameter };
    case 'box':
      return { type: 'box', width: controls.width, height: controls.height };
    case 'cone2d':
      return { type: 'cone2d', width: controls.width, height: controls.height };
    case 'point':
      return { type: 'point' };
    default:
      throw new Error(`Unsupported emitter shape: ${String(controls.shape satisfies never)}`);
  }
}
