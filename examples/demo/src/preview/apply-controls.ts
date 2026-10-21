import type { EmitterConfig, EmitterParameters } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';
import { alphaCurves } from './alpha-curves';
import { angularVelocityCurves } from './angular-velocity-curves';
import { colorCurves } from './color-curves';
import { emissionRate } from './emission-rate';
import { emitterDiameter } from './emitter-diameter';
import { emitterHeight } from './emitter-height';
import { emitterWidth } from './emitter-width';
import { initialAlpha } from './initial-alpha';
import { initialAngularVelocity } from './initial-angular-velocity';
import { initialBlue } from './initial-blue';
import { initialGreen } from './initial-green';
import { initialLifetime } from './initial-lifetime';
import { initialRed } from './initial-red';
import { initialRotation } from './initial-rotation';
import { initialSize } from './initial-size';
import { initialSpeed } from './initial-speed';
import { initialStretch } from './initial-stretch';
import { controlledModifiers } from './modifiers';
import { rotationCurves } from './rotation-curves';
import { sizeCurves } from './size-curves';
import { stretchCurves } from './stretch-curves';

/** Maps demo settings onto an emitter definition without modifying the original. */
export function applyControls(definition: EmitterConfig, controls: PreviewControls): EmitterConfig {
  const shape = emitterShape(controls);
  const emission = {
    ...definition.emission,
    rate: emissionRate(controls),
    rateSpread: controls.rateSpread,
    shape,
  };
  const initial = {
    ...definition.initial,
    lifetime: initialLifetime(controls),
    lifetimeSpread: controls.lifetimeSpread,
    speed: initialSpeed(controls),
    speedSpread: controls.speedSpread,
    size: initialSize(controls),
    sizeSpread: controls.sizeSpread,
    redSpread: controls.redSpread,
    greenSpread: controls.greenSpread,
    blueSpread: controls.blueSpread,
    alphaSpread: controls.alphaSpread,

    rotationSpread: controls.rotationSpread,
    rotation: initialRotation(controls),
    stretchX: initialStretch(controls, 'X'),
    stretchY: initialStretch(controls, 'Y'),
    stretchXSpread: controls.stretchXSpread,
    stretchYSpread: controls.stretchYSpread,
    angularVelocity: initialAngularVelocity(controls),
    angularVelocitySpread: controls.angularVelocitySpread,
    alpha: initialAlpha(controls),
    red: initialRed(controls),
    green: initialGreen(controls),
    blue: initialBlue(controls),
  };
  return {
    ...definition,
    capacity: controls.capacity,
    startOffset: controls.startOffset,
    startDelay: controls.startDelay,
    startDelaySpread: controls.startDelaySpread,
    durationSpread: controls.durationSpread,
    duration: controls.duration,
    orientation: controls.orientation,
    playMode: controls.playMode,
    emission,
    initial,
    overLifetime: {
      ...(controls.colorCurve === 'effect'
        ? definition.overLifetime
        : colorCurves[controls.colorCurve]),
      angularVelocity:
        controls.angularVelocityCurve === 'effect'
          ? definition.overLifetime.angularVelocity
          : angularVelocityCurves[controls.angularVelocityCurve],
      stretchX:
        controls.stretchXCurve === 'effect'
          ? definition.overLifetime.stretchX
          : stretchCurves[controls.stretchXCurve],
      stretchY:
        controls.stretchYCurve === 'effect'
          ? definition.overLifetime.stretchY
          : stretchCurves[controls.stretchYCurve],
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
    modifiers: controlledModifiers(definition.modifiers, controls),
    inheritVelocity: controls.inheritVelocity,
    rotation: controls.emitterRotation,
    scale: controls.emitterScale,
    space: controls.space,
    rendering: { ...definition.rendering, blendMode: controls.blendMode },
    stretchWithVelocity: controls.stretchWithVelocity,
  };
}

export function initialControls(definition: EmitterConfig): PreviewControls {
  const acceleration = definition.modifiers.find(
    (modifier) => modifier.type === 'acceleration',
  ) ?? { magnitude: 0, spread: 0, rotation: 0 };
  const drag = definition.modifiers.find((modifier) => modifier.type === 'drag') ?? {
    magnitude: 0,
    spread: 0,
    rotation: 0,
    useDirection: false,
  };
  const radial = definition.modifiers.find((modifier) => modifier.type === 'radial') ?? {
    magnitude: 0,
    spread: 0,
    x: 0,
    y: 0,
    maxDistance: 100,
  };
  const vortex = definition.modifiers.find((modifier) => modifier.type === 'vortex') ?? {
    magnitude: 0,
    spread: 0,
    x: 0,
    y: 0,
    maxDistance: 100,
    rotation: 0,
  };
  const shape = definition.emission.shape;
  return {
    capacity: definition.capacity,
    startOffset: definition.startOffset,
    startDelay: definition.startDelay,
    startDelaySpread: definition.startDelaySpread,
    durationSpread: definition.durationSpread,
    duration: definition.duration,
    orientation: definition.orientation,
    playMode: definition.playMode,
    shape: definition.emission.shape.type,
    diameter: shape.type === 'circle' && typeof shape.diameter === 'number' ? shape.diameter : 100,
    diameterCurve:
      shape.type === 'circle' && typeof shape.diameter !== 'number' ? 'effect' : 'constant',
    effectDiameter: shape.type === 'circle' ? shape.diameter : 100,
    diameterSpread: shape.type === 'circle' ? shape.diameterSpread : 0,
    width: 'width' in shape && typeof shape.width === 'number' ? shape.width : 200,
    widthCurve: 'width' in shape && typeof shape.width !== 'number' ? 'effect' : 'constant',
    effectWidth: 'width' in shape ? shape.width : 200,
    widthSpread: 'widthSpread' in shape ? shape.widthSpread : 0,
    height: 'height' in shape && typeof shape.height === 'number' ? shape.height : 100,
    heightCurve: 'height' in shape && typeof shape.height !== 'number' ? 'effect' : 'constant',
    effectHeight: 'height' in shape ? shape.height : 100,
    heightSpread: 'heightSpread' in shape ? shape.heightSpread : 0,
    rateSpread: definition.emission.rateSpread,
    rate: typeof definition.emission.rate === 'number' ? definition.emission.rate : 4000,
    rateCurve: typeof definition.emission.rate === 'number' ? 'constant' : 'effect',
    effectRate: definition.emission.rate,
    vortexRotation: vortex.rotation,
    vortex: typeof vortex.magnitude === 'number' ? vortex.magnitude : 160,
    vortexCurve: typeof vortex.magnitude === 'number' ? 'constant' : 'effect',
    effectVortex: vortex.magnitude,
    vortexSpread: vortex.spread,
    vortexX: vortex.x,
    vortexY: vortex.y,
    vortexMaxDistance: vortex.maxDistance,
    radial: typeof radial.magnitude === 'number' ? radial.magnitude : 160,
    radialCurve: typeof radial.magnitude === 'number' ? 'constant' : 'effect',
    effectRadial: radial.magnitude,
    radialSpread: radial.spread,
    radialX: radial.x,
    radialY: radial.y,
    radialMaxDistance: radial.maxDistance,
    acceleration: typeof acceleration.magnitude === 'number' ? acceleration.magnitude : 160,
    accelerationCurve: typeof acceleration.magnitude === 'number' ? 'constant' : 'effect',
    effectAcceleration: acceleration.magnitude,
    accelerationSpread: acceleration.spread,
    accelerationRotation: acceleration.rotation,
    drag: typeof drag.magnitude === 'number' ? drag.magnitude : 1,
    dragCurve: typeof drag.magnitude === 'number' ? 'constant' : 'effect',
    effectDrag: drag.magnitude,
    dragSpread: drag.spread,
    dragDirectional: drag.useDirection,
    dragRotation: drag.rotation,
    inheritVelocity: definition.inheritVelocity,
    emitterRotation: definition.rotation,
    emitterScale: definition.scale,
    space: definition.space,
    blendMode: definition.rendering?.blendMode ?? 'normal',
    stretchWithVelocity: definition.stretchWithVelocity,
    lifetime: typeof definition.initial.lifetime === 'number' ? definition.initial.lifetime : 2,
    initialLifetimeCurve: typeof definition.initial.lifetime === 'number' ? 'constant' : 'effect',
    effectLifetime: definition.initial.lifetime,
    lifetimeSpread: definition.initial.lifetimeSpread,
    speed: typeof definition.initial.speed === 'number' ? definition.initial.speed : 220,
    speedCurve: typeof definition.initial.speed === 'number' ? 'constant' : 'effect',
    effectSpeed: definition.initial.speed,
    speedSpread: definition.initial.speedSpread,
    seed: definition.seed,
    texture: 'star',
    size: typeof definition.initial.size === 'number' ? definition.initial.size : 24,
    initialSizeCurve: typeof definition.initial.size === 'number' ? 'constant' : 'effect',
    effectSize: definition.initial.size,
    sizeSpread: definition.initial.sizeSpread,
    redSpread: definition.initial.redSpread,
    greenSpread: definition.initial.greenSpread,
    blueSpread: definition.initial.blueSpread,
    alphaSpread: definition.initial.alphaSpread,

    rotationSpread: definition.initial.rotationSpread,
    stretchX: typeof definition.initial.stretchX === 'number' ? definition.initial.stretchX : 1,
    stretchXSpread: definition.initial.stretchXSpread,
    initialStretchXCurve: typeof definition.initial.stretchX === 'number' ? 'constant' : 'effect',
    effectStretchX: definition.initial.stretchX,
    stretchXCurve: 'effect',
    stretchY: typeof definition.initial.stretchY === 'number' ? definition.initial.stretchY : 1,
    stretchYSpread: definition.initial.stretchYSpread,
    initialStretchYCurve: typeof definition.initial.stretchY === 'number' ? 'constant' : 'effect',
    effectStretchY: definition.initial.stretchY,
    stretchYCurve: 'effect',
    sizeCurve: 'effect',
    rotation: typeof definition.initial.rotation === 'number' ? definition.initial.rotation : 0,
    initialRotationCurve: typeof definition.initial.rotation === 'number' ? 'constant' : 'effect',
    effectRotation: definition.initial.rotation,
    rotationCurve: 'effect',
    angularVelocity:
      typeof definition.initial.angularVelocity === 'number'
        ? definition.initial.angularVelocity
        : 90,
    angularVelocitySpread: definition.initial.angularVelocitySpread,
    initialAngularVelocityCurve:
      typeof definition.initial.angularVelocity === 'number' ? 'constant' : 'effect',
    effectAngularVelocity: definition.initial.angularVelocity,
    angularVelocityCurve: 'effect',
    alpha: typeof definition.initial.alpha === 'number' ? definition.initial.alpha : 1,
    initialAlphaCurve: typeof definition.initial.alpha === 'number' ? 'constant' : 'effect',
    effectAlpha: definition.initial.alpha,
    alphaCurve: 'effect',
    red: typeof definition.initial.red === 'number' ? definition.initial.red : 1,
    initialRedCurve: typeof definition.initial.red === 'number' ? 'constant' : 'effect',
    effectRed: definition.initial.red,
    green: typeof definition.initial.green === 'number' ? definition.initial.green : 1,
    initialGreenCurve: typeof definition.initial.green === 'number' ? 'constant' : 'effect',
    effectGreen: definition.initial.green,
    blue: typeof definition.initial.blue === 'number' ? definition.initial.blue : 1,
    initialBlueCurve: typeof definition.initial.blue === 'number' ? 'constant' : 'effect',
    effectBlue: definition.initial.blue,
    colorCurve: 'effect',
    paused: false,
    statsVisible: true,
  };
}

export function emitterParameters(
  controls: PreviewControls,
  modifiers: EmitterConfig['modifiers'] = [],
): EmitterParameters {
  const emission: EmitterParameters['emission'] =
    controls.rateCurve === 'constant' ? { rate: controls.rate } : {};
  if (controls.shape === 'circle') {
    emission.shape = {
      ...(controls.diameterCurve === 'constant' ? { diameter: controls.diameter } : {}),
      diameterSpread: controls.diameterSpread,
    };
  } else if (controls.shape === 'box' || controls.shape === 'cone2d') {
    emission.shape = {
      ...(controls.widthCurve === 'constant' ? { width: controls.width } : {}),
      ...(controls.heightCurve === 'constant' ? { height: controls.height } : {}),
      widthSpread: controls.widthSpread,
      heightSpread: controls.heightSpread,
    };
  }
  return {
    stretchWithVelocity: controls.stretchWithVelocity,
    emission,
    initial: {
      ...(controls.initialLifetimeCurve === 'constant' ? { lifetime: controls.lifetime } : {}),
      lifetimeSpread: controls.lifetimeSpread,
      ...(controls.speedCurve === 'constant' ? { speed: controls.speed } : {}),
      speedSpread: controls.speedSpread,
      ...(controls.initialSizeCurve === 'constant' ? { size: controls.size } : {}),
      sizeSpread: controls.sizeSpread,
      redSpread: controls.redSpread,
      greenSpread: controls.greenSpread,
      blueSpread: controls.blueSpread,
      alphaSpread: controls.alphaSpread,

      rotationSpread: controls.rotationSpread,
      ...(controls.initialAngularVelocityCurve === 'constant'
        ? { angularVelocity: controls.angularVelocity }
        : {}),
      angularVelocitySpread: controls.angularVelocitySpread,
      ...(controls.initialStretchXCurve === 'constant' ? { stretchX: controls.stretchX } : {}),
      ...(controls.initialStretchYCurve === 'constant' ? { stretchY: controls.stretchY } : {}),
      stretchXSpread: controls.stretchXSpread,
      stretchYSpread: controls.stretchYSpread,
      ...(controls.initialRotationCurve === 'constant' ? { rotation: controls.rotation } : {}),
      ...(controls.initialAlphaCurve === 'constant' ? { alpha: controls.alpha } : {}),
      ...(controls.initialRedCurve === 'constant' ? { red: controls.red } : {}),
      ...(controls.initialGreenCurve === 'constant' ? { green: controls.green } : {}),
      ...(controls.initialBlueCurve === 'constant' ? { blue: controls.blue } : {}),
    },
    modifiers: controlledModifiers(modifiers, controls),
    inheritVelocity: controls.inheritVelocity,
    rotation: controls.emitterRotation,
    scale: controls.emitterScale,
  };
}

function emitterShape(controls: PreviewControls): EmitterConfig['emission']['shape'] {
  switch (controls.shape) {
    case 'circle':
      return {
        type: 'circle',
        diameter: emitterDiameter(controls),
        diameterSpread: controls.diameterSpread,
      };
    case 'box':
      return {
        type: 'box',
        width: emitterWidth(controls),
        height: emitterHeight(controls),
        widthSpread: controls.widthSpread,
        heightSpread: controls.heightSpread,
      };
    case 'cone2d':
      return {
        type: 'cone2d',
        width: emitterWidth(controls),
        height: emitterHeight(controls),
        widthSpread: controls.widthSpread,
        heightSpread: controls.heightSpread,
      };
    case 'point':
      return { type: 'point' };
    default:
      throw new Error(`Unsupported emitter shape: ${String(controls.shape satisfies never)}`);
  }
}
