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
