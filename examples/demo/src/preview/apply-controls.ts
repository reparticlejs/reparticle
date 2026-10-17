import type { EmitterConfig, EmitterParameters } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';
import { alphaCurves } from './alpha-curves';
import { colorCurves } from './color-curves';
import { emissionRate } from './emission-rate';
import { rotationCurves } from './rotation-curves';
import { sizeCurves } from './size-curves';

/** Maps demo settings onto an emitter definition without modifying the original. */
export function applyControls(definition: EmitterConfig, controls: PreviewControls): EmitterConfig {
  const shape = emitterShape(controls);
  const emission = { ...definition.emission, rate: emissionRate(controls), shape };
  const initial = {
    ...definition.initial,
    lifetime: controls.lifetime,
    lifetimeSpread: controls.lifetimeSpread,
    speed: controls.speed,
    speedSpread: controls.speedSpread,
    size: controls.size,
    sizeSpread: controls.sizeSpread,
    redSpread: controls.redSpread,
    greenSpread: controls.greenSpread,
    blueSpread: controls.blueSpread,
    alphaSpread: controls.alphaSpread,

    rotationSpread: controls.rotationSpread,
    rotation: controls.rotation,
    alpha: controls.alpha,
    red: controls.red,
    green: controls.green,
    blue: controls.blue,
  };
  const gravity = { ...definition.modifiers.gravity, y: controls.gravity };

  return {
    ...definition,
    capacity: controls.capacity,
    startOffset: controls.startOffset,
    startDelay: controls.startDelay,
    duration: controls.duration,
    orientation: controls.orientation,
    playMode: controls.playMode,
    emission,
    initial,
    overLifetime: {
      ...(controls.colorCurve === 'effect'
        ? definition.overLifetime
        : colorCurves[controls.colorCurve]),
      rotation:
        controls.rotationCurve === 'effect'
          ? definition.overLifetime.rotation
          : rotationCurves[controls.rotationCurve],
      alpha:
        controls.alphaCurve === 'effect'
          ? definition.overLifetime.alpha
          : alphaCurves[controls.alphaCurve],
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
    orientation: definition.orientation,
    playMode: definition.playMode,
    shape: definition.emission.shape.type,
    diameter:
      definition.emission.shape.type === 'circle' ? definition.emission.shape.diameter : 100,
    width: 'width' in shape ? shape.width : 200,
    height: 'height' in shape ? shape.height : 100,
    rate: typeof definition.emission.rate === 'number' ? definition.emission.rate : 4000,
    rateCurve: typeof definition.emission.rate === 'number' ? 'constant' : 'effect',
    effectRate: definition.emission.rate,
    gravity: definition.modifiers.gravity.y,
    lifetime: definition.initial.lifetime,
    lifetimeSpread: definition.initial.lifetimeSpread,
    speed: definition.initial.speed,
    speedSpread: definition.initial.speedSpread,
    seed: definition.seed,
    texture: 'star',
    size: definition.initial.size,
    sizeSpread: definition.initial.sizeSpread,
    redSpread: definition.initial.redSpread,
    greenSpread: definition.initial.greenSpread,
    blueSpread: definition.initial.blueSpread,
    alphaSpread: definition.initial.alphaSpread,

    rotationSpread: definition.initial.rotationSpread,
    sizeCurve: 'effect',
    rotation: definition.initial.rotation,
    rotationCurve: 'effect',
    alpha: definition.initial.alpha,
    alphaCurve: 'effect',
    red: definition.initial.red,
    green: definition.initial.green,
    blue: definition.initial.blue,
    colorCurve: 'effect',
    paused: false,
    statsVisible: true,
  };
}

export function emitterParameters(controls: PreviewControls): EmitterParameters {
  const emission: EmitterParameters['emission'] =
    controls.rateCurve === 'constant' ? { rate: controls.rate } : {};
  if (controls.shape === 'circle') {
    emission.shape = { diameter: controls.diameter };
  } else if (controls.shape === 'box' || controls.shape === 'cone2d') {
    emission.shape = { width: controls.width, height: controls.height };
  }
  return {
    emission,
    initial: {
      lifetime: controls.lifetime,
      lifetimeSpread: controls.lifetimeSpread,
      speed: controls.speed,
      speedSpread: controls.speedSpread,
      size: controls.size,
      sizeSpread: controls.sizeSpread,
      redSpread: controls.redSpread,
      greenSpread: controls.greenSpread,
      blueSpread: controls.blueSpread,
      alphaSpread: controls.alphaSpread,

      rotationSpread: controls.rotationSpread,
      rotation: controls.rotation,
      alpha: controls.alpha,
      red: controls.red,
      green: controls.green,
      blue: controls.blue,
    },
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
