import { expect, it } from 'vitest';

import { PreviewParticleCount } from '#src/devtools/stats/measurement/preview-particle-count.js';
import type { PreviewControls } from '#src/types/preview.js';

const controls: PreviewControls = {
  capacity: 8192,
  shape: 'point',
  startOffset: 0.1,
  startDelay: 0,
  duration: 1,
  orientation: 'default',
  playMode: 'loop',
  rateCurve: 'constant',
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
  diameter: 100,
  width: 100,
  height: 100,
  rate: 60,
  gravity: 0,
  lifetime: 1,
  texture: 'star',
  size: 24,
  sizeCurve: 'effect',
  rotation: 0,
  rotationCurve: 'effect',
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
