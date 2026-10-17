import { expect, it } from 'vitest';

import { LiveParticleCount } from '#src/devtools/stats/measurement/live-particle-count.js';

it('starts newborns at age zero and expires them at their original lifetime', () => {
  const tracker = new LiveParticleCount(100);
  tracker.recordStep(0.1, 10, 0.2);
  tracker.recordStep(0.1, 5, 1);
  expect(tracker.count).toBe(15);
  tracker.recordStep(0.1, 0, 10);
  expect(tracker.count).toBe(5);
  tracker.reset();
  expect(tracker.count).toBe(0);
});

it('matches individual float32 slots through wraparound, lifetime changes and resets', () => {
  const capacity = 17;
  const tracker = new LiveParticleCount(capacity);
  const slots = Array.from({ length: capacity }, () => ({ age: 0, lifetime: 0 }));
  let cursor = 0;
  for (let frame = 0; frame < 1000; frame++) {
    const seconds = frame % 13 === 0 ? 0 : ((frame % 5) + 1) / 100;
    const spawned = frame % 11 === 0 ? capacity : frame % 4;
    const lifetime = ((frame % 7) + 1) / 10;
    for (const slot of slots) {
      slot.age = Math.fround(slot.age + Math.fround(seconds));
    }
    for (let birth = 0; birth < spawned; birth++) {
      slots[cursor] = { age: 0, lifetime: Math.fround(lifetime) };
      cursor = (cursor + 1) % capacity;
    }
    tracker.recordStep(seconds, spawned, lifetime);
    expect(tracker.count).toBe(slots.filter((slot) => slot.age < slot.lifetime).length);
  }
});

it('does not count expired slots again when older batches are overwritten', () => {
  const tracker = new LiveParticleCount(10);
  tracker.recordStep(0, 5, 0.1);
  tracker.recordStep(0, 5, 10);
  tracker.recordStep(0.1, 3, 1);
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

it('expires varied lifetimes and replaces slots without retaining old births', () => {
  const count = new LiveParticleCount(8);
  count.recordStep(0.1, 8, 0.2, 0.4, 1);
  expect(count.count).toBeGreaterThan(0);
  expect(count.count).toBeLessThanOrEqual(8);
  count.recordStep(0.1, 8, 1, 0, 2);
  expect(count.count).toBe(8);
  for (let index = 0; index < 6; index++) {
    count.recordStep(0.1, 0, 0.01, 5, 3);
  }
  expect(count.count).toBe(8);
  for (let index = 0; index < 5; index++) {
    count.recordStep(0.1, 0, 1);
  }
  expect(count.count).toBe(0);
});
