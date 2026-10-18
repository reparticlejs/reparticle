import { propertyVariation } from '@reparticle/core';
import { expect, it } from 'vitest';

import { PreviewParticleCount } from '#src/devtools/stats/measurement/preview-particle-count.js';
import type { PreviewControls } from '#src/types/preview.js';

const controls: PreviewControls = {
  capacity: 8192,
  shape: 'point',
  startOffset: 0.1,
  startDelay: 0,
  startDelaySpread: 0,
  durationSpread: 0,
  duration: 1,
  orientation: 'default',
  playMode: 'loop',
  rateCurve: 'constant',
  speedCurve: 'constant',
  initialSizeCurve: 'constant',
  initialLifetimeCurve: 'constant',
  effectLifetime: 2,
  initialRotationCurve: 'constant',
  initialAlphaCurve: 'constant',
  effectAlpha: 1,
  initialBlueCurve: 'constant',
  effectBlue: 1,
  initialGreenCurve: 'constant',
  effectGreen: 1,
  initialRedCurve: 'constant',
  effectRed: 1,
  effectRotation: 0,
  effectSize: 24,
  effectSpeed: 220,
  effectRate: 4000,
  speed: 220,
  speedSpread: 0,
  sizeSpread: 0,
  redSpread: 0,
  greenSpread: 0,
  blueSpread: 0,
  alphaSpread: 0,

  rotationSpread: 0,
  lifetimeSpread: 0,
  seed: 1,
  diameterCurve: 'constant',
  diameterSpread: 0,
  effectDiameter: 100,
  widthCurve: 'constant',
  widthSpread: 0,
  effectWidth: 100,
  heightCurve: 'constant',
  heightSpread: 0,
  effectHeight: 100,
  diameter: 100,
  width: 100,
  height: 100,
  rate: 60,
  rateSpread: 0,
  inheritVelocity: 0,
  emitterRotation: 0,
  emitterScale: 1,
  accelerationSpread: 0,
  accelerationRotation: 180,
  accelerationCurve: 'constant',
  effectAcceleration: 160,
  radial: 0,
  radialSpread: 0,
  radialX: 0,
  radialY: 0,
  radialMaxDistance: 100,
  radialCurve: 'constant',
  effectRadial: 0,
  vortex: 0,
  vortexSpread: 0,
  vortexX: 0,
  vortexY: 0,
  vortexMaxDistance: 100,
  vortexRotation: 0,
  vortexCurve: 'constant',
  effectVortex: 0,
  drag: 0,
  dragSpread: 0,
  dragDirectional: false,
  dragRotation: 0,
  dragCurve: 'constant',
  effectDrag: 0,
  space: 'world',
  acceleration: 0,
  lifetime: 1,
  texture: 'star',
  size: 24,
  sizeCurve: 'effect',
  stretchWithVelocity: false,
  stretchX: 0,
  stretchXSpread: 0,
  initialStretchXCurve: 'constant',
  effectStretchX: 0,
  stretchXCurve: 'effect',
  stretchY: 0,
  stretchYSpread: 0,
  initialStretchYCurve: 'constant',
  effectStretchY: 0,
  stretchYCurve: 'effect',

  rotation: 0,
  rotationCurve: 'effect',
  angularVelocity: 0,
  angularVelocitySpread: 0,
  initialAngularVelocityCurve: 'constant',
  effectAngularVelocity: 0,
  angularVelocityCurve: 'effect',
  alpha: 1,
  alphaCurve: 'effect',
  red: 1,
  green: 1,
  blue: 1,
  colorCurve: 'effect',
  paused: false,
  statsVisible: true,
};

it('counts prewarmed births once, then continues the same spawn schedule', () => {
  const count = new PreviewParticleCount(8192);
  count.advance(0, controls, true);
  expect(count.count).toBe(0);
  count.advance(1 / 60, controls, true);
  expect(count.count).toBe(7);
  count.advance(1 / 60, controls, true);
  expect(count.count).toBe(8);
});

it('includes delay and stops once emission during prewarm', () => {
  const count = new PreviewParticleCount(8192);
  count.advance(1 / 60, { ...controls, startDelay: 0.05, duration: 0.05, playMode: 'once' }, true);
  expect(count.count).toBe(3);
  count.advance(1 / 60, controls, true);
  expect(count.count).toBe(3);
});

it('respects the manual emission gate during prewarm', () => {
  const count = new PreviewParticleCount(8192);
  count.advance(1 / 60, controls, false);
  expect(count.count).toBe(0);
});

it('uses maximum lifetime for prewarm and repeats spread samples after recreation', () => {
  const settings = { ...controls, startOffset: 2, lifetime: 0.1, lifetimeSpread: 0.4, rate: 600 };
  const first = new PreviewParticleCount(8192);
  const second = new PreviewParticleCount(8192);
  first.advance(0.1, settings, true);
  second.advance(0.1, settings, true);
  expect(first.count).toBe(second.count);
  expect(first.count).toBeGreaterThan(0);
  for (let index = 0; index < 6; index++) {
    first.advance(0.1, settings, false);
  }
  expect(first.count).toBe(0);
});

it('mirrors rate curves on once and loop boundary frames', () => {
  for (const playMode of ['once', 'loop'] as const) {
    const counter = new PreviewParticleCount(8192);
    const settings = {
      ...controls,
      startOffset: 0,
      duration: 0.2,
      playMode,
      rate: 100,
      rateCurve: 'ramp-up' as const,
    };
    counter.advance(0.1, settings, true);
    expect(counter.count).toBe(5);
    counter.advance(0.1, settings, true);
    expect(counter.count).toBe(playMode === 'once' ? 15 : 5);
  }
});

it('expires each birth batch using its captured emitter-time lifetime', () => {
  const counter = new PreviewParticleCount(8192);
  const settings = {
    ...controls,
    startOffset: 0,
    duration: 0.2,
    playMode: 'once' as const,
    rate: 10,
    lifetime: 0.4,
    initialLifetimeCurve: 'ramp-up' as const,
  };
  counter.advance(0.1, settings, true);
  expect(counter.count).toBe(1);
  counter.advance(0.1, settings, true);
  expect(counter.count).toBe(2);
  counter.advance(0.1, { ...settings, initialLifetimeCurve: 'constant', lifetime: 10 }, false);
  expect(counter.count).toBe(1);
  for (let i = 0; i < 4; i++) {
    counter.advance(0.1, settings, false);
  }
  expect(counter.count).toBe(0);
});

it.each(['once', 'loop'] as const)(
  'mirrors sampled timing during prewarm and %s playback',
  (playMode) => {
    const varied = {
      ...controls,
      playMode,
      seed: 42,
      duration: 0.3,
      durationSpread: 0.2,
      startDelay: 0.1,
      startDelaySpread: 0.3,
      startOffset: 0.5,
    };
    const resolved = {
      ...varied,
      duration: Math.max(
        0,
        varied.duration + propertyVariation(0, varied.seed, 9) * varied.durationSpread,
      ),
      startDelay:
        varied.startDelay + propertyVariation(0, varied.seed, 10) * varied.startDelaySpread,
      durationSpread: 0,
      startDelaySpread: 0,
    };
    const actual = new PreviewParticleCount(controls.capacity);
    const expected = new PreviewParticleCount(controls.capacity);
    for (let frame = 0; frame < 60; frame++) {
      actual.advance(1 / 60, varied, true);
      expected.advance(1 / 60, resolved, true);
      expect(actual.count).toBe(expected.count);
    }
  },
);

it.each(['once', 'loop'] as const)(
  'includes spawn-rate spread in prewarm and %s playback',
  (playMode) => {
    const varied = {
      ...controls,
      playMode,
      seed: 42,
      rate: 100,
      rateSpread: 50,
      duration: 0.3,
      startOffset: 0.5,
    };
    const resolved = {
      ...varied,
      rate: Math.max(0, varied.rate + propertyVariation(0, varied.seed, 11) * varied.rateSpread),
      rateSpread: 0,
    };
    const actual = new PreviewParticleCount(controls.capacity);
    const expected = new PreviewParticleCount(controls.capacity);
    for (let frame = 0; frame < 60; frame++) {
      actual.advance(1 / 60, varied, true);
      expected.advance(1 / 60, resolved, true);
      expect(actual.count).toBe(expected.count);
    }
  },
);
