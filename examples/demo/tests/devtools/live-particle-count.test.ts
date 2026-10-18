import { expect, it } from 'vitest';

import { LiveParticleCount } from '#src/devtools/stats/measurement/live-particle-count.js';

it('ages newborns on their first step and expires them at their original lifetime', () => {
  const tracker = new LiveParticleCount(100);
  tracker.recordStep(0.1, 10, 0.2);
  tracker.recordStep(0.1, 5, 1);
  expect(tracker.count).toBe(15);
  tracker.recordStep(0.1, 0, 10);
  expect(tracker.count).toBe(5);
  tracker.reset();
  expect(tracker.count).toBe(0);
});

it('reuses expired slots and caps births at remaining capacity', () => {
  const tracker = new LiveParticleCount(10);
  tracker.recordStep(0, 5, 0.1);
  tracker.recordStep(0, 5, 10);
  tracker.recordStep(0.2, 3, 1);
  expect(tracker.count).toBe(8);
  tracker.recordStep(0, 4, 1);
  expect(tracker.count).toBe(10);
});

it('preserves fractional spawn carry across rate changes and clears it on reset', () => {
  const tracker = new LiveParticleCount(10);
  tracker.advance(0.1, 5, 10);
  expect(tracker.count).toBe(0);
  tracker.advance(0.1, 0, 10);
  tracker.advance(0.1, 5, 10);
  expect(tracker.count).toBe(1);
  tracker.advance(0.1, 5, 10);
  tracker.reset();
  tracker.advance(0.1, 5, 10);
  expect(tracker.count).toBe(0);
  tracker.advance(0.1, 1000, 10);
  expect(tracker.count).toBe(10);
});

it('expires varied lifetimes without replacing surviving births', () => {
  const count = new LiveParticleCount(8);
  count.recordStep(0.1, 8, 0.2, 0.4, 1);
  expect(count.count).toBeGreaterThan(0);
  expect(count.count).toBeLessThanOrEqual(8);
  count.recordStep(0.1, 8, 1, 0, 2);
  expect(count.count).toBe(8);
  for (let index = 0; index < 6; index++) {
    count.recordStep(0.1, 0, 0.01, 5, 3);
  }
  expect(count.count).toBeLessThan(8);
  for (let index = 0; index < 5; index++) {
    count.recordStep(0.1, 0, 1);
  }
  expect(count.count).toBe(0);
});

it.each([0.01, 0, -0.1])('retains newborn lifetime %s until the next positive step', (lifetime) => {
  const tracker = new LiveParticleCount(10);
  tracker.recordStep(0.1, 3, lifetime);
  expect(tracker.count).toBe(3);
  tracker.recordStep(0, 0, lifetime);
  expect(tracker.count).toBe(3);
  tracker.recordStep(0.01, 0, lifetime);
  expect(tracker.count).toBe(0);
});

it('does not revive expired spread samples on a zero-time update', () => {
  const tracker = new LiveParticleCount(100);
  tracker.recordStep(0.1, 100, 0.1, 0.3);
  expect(tracker.count).toBe(100);
  tracker.recordStep(0.1, 0, 0.1, 0.3);
  const survivors = tracker.count;
  expect(survivors).toBeGreaterThan(0);
  expect(survivors).toBeLessThan(100);
  tracker.recordStep(0, 0, 0.1, 0.3);
  expect(tracker.count).toBe(survivors);
});
