import { expect, it } from 'vitest';

import { propertyVariation } from '#src/behaviors/property-variation.js';
import { EmitterPlayback } from '#src/emitter-playback.js';
import { SpawnSchedule } from '#src/spawn-schedule.js';

it('emits the complete boundary step before once stops', () => {
  const playback = new EmitterPlayback(0.25, 'once');
  const schedule = new SpawnSchedule(100);
  const counts = [0.1, 0.1, 0.1, 0.1].map(
    (seconds) => schedule.next(playback.advance(seconds) ? 100 : 0, seconds).count,
  );
  expect(counts).toEqual([10, 10, 10, 0]);
  expect(playback.emitting).toBe(false);
});

it('stops at an exact duration boundary without an extra floating-point frame', () => {
  const playback = new EmitterPlayback(1, 'once');
  for (let frame = 0; frame < 10; frame++) {
    expect(playback.advance(0.1)).toBe(true);
  }
  expect(playback.emitting).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
});

it('does not consume a zero-duration effect during zero-time initialization', () => {
  const playback = new EmitterPlayback(0, 'once');
  expect(playback.advance(0)).toBe(false);
  expect(playback.emitting).toBe(true);
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.emitting).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
});

it.each([0, 0.01, 0.1, 0.25])(
  'loops duration %s without clearing fractional emission or slots',
  (duration) => {
    const playback = new EmitterPlayback(duration, 'loop');
    const schedule = new SpawnSchedule(100);
    let total = 0;
    for (let frame = 0; frame < 10; frame++) {
      const step = schedule.next(playback.advance(0.1) ? 15 : 0, 0.1);
      expect(step.start).toBe(total);
      total += step.count;
    }
    expect(total).toBe(15);
    expect(playback.emitting).toBe(true);
  },
);

it('reset restarts a completed once effect', () => {
  const playback = new EmitterPlayback(0.1, 'once');
  playback.advance(0.1);
  playback.reset();
  expect(playback.emitting).toBe(true);
  expect(playback.advance(0.05)).toBe(true);
  expect(playback.emitting).toBe(true);
  expect(playback.advance(0.05)).toBe(true);
  expect(playback.emitting).toBe(false);
});

it('waits through the delay boundary and emits on the following frame', () => {
  const playback = new EmitterPlayback(0.2, 'once', 0.2);
  const schedule = new SpawnSchedule(100);
  const counts = Array.from({ length: 5 }, () => {
    const eligible = playback.emitting;
    const emitting = playback.advance(0.1);
    expect(emitting).toBe(eligible);
    return schedule.next(emitting ? 100 : 0, 0.1).count;
  });
  expect(counts).toEqual([0, 0, 10, 10, 0]);
});

it('carries delay overshoot into duration without emitting during the waiting frame', () => {
  const playback = new EmitterPlayback(0.15, 'once', 0.05);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.emitting).toBe(false);
});

it('applies delay only once across loops and reapplies it after reset', () => {
  const playback = new EmitterPlayback(0.1, 'loop', 0.2);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
  for (let frame = 0; frame < 5; frame++) {
    expect(playback.advance(0.1)).toBe(true);
  }
  playback.reset();
  expect(playback.emitting).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0.1)).toBe(true);
});

it('does not advance delay on zero-time updates', () => {
  const playback = new EmitterPlayback(0, 'once', 0.1);
  expect(playback.advance(0)).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0)).toBe(false);
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.advance(0.1)).toBe(false);
});

it('avoids an extra waiting frame at a decimal delay boundary', () => {
  const playback = new EmitterPlayback(1, 'once', 1);
  for (let frame = 0; frame < 10; frame++) {
    expect(playback.advance(0.1)).toBe(false);
  }
  expect(playback.emitting).toBe(true);
  expect(playback.advance(0.1)).toBe(true);
});

it('samples independent timing spreads once and preserves them on reset', () => {
  const options = { seed: 42, durationSpread: 0.4, startDelaySpread: 0.3 };
  const duration = Math.max(
    0,
    0.5 + propertyVariation(0, options.seed, 9) * options.durationSpread,
  );
  const delay = 0.4 + propertyVariation(0, options.seed, 10) * options.startDelaySpread;
  const playback = new EmitterPlayback(0.5, 'once', 0.4, options);
  const reference = new EmitterPlayback(duration, 'once', delay);
  for (let replay = 0; replay < 2; replay++) {
    for (let frame = 0; frame < 30; frame++) {
      expect(playback.advance(0.05)).toBe(reference.advance(0.05));
      expect(playback.normalizedAge).toBe(reference.normalizedAge);
      expect(playback.emitting).toBe(reference.emitting);
    }
    playback.reset();
    reference.reset();
  }
});

it('keeps sampled timing across loops and uses the sampled duration for curve age', () => {
  const options = { seed: 42, durationSpread: 0.2, startDelaySpread: 0.1 };
  const duration = 0.3 + propertyVariation(0, 42, 9) * 0.2;
  const delay = 0.2 + propertyVariation(0, 42, 10) * 0.1;
  const playback = new EmitterPlayback(0.3, 'loop', 0.2, options);
  const reference = new EmitterPlayback(duration, 'loop', delay);
  for (let frame = 0; frame < 100; frame++) {
    expect(playback.advance(0.05)).toBe(reference.advance(0.05));
    expect(playback.normalizedAge).toBe(reference.normalizedAge);
  }
});

it('clamps negative sampled duration to zero but retains negative delay as clock offset', () => {
  const seed = Array.from({ length: 100 }, (_, index) => index).find(
    (value) => propertyVariation(0, value, 9) < 0 && propertyVariation(0, value, 10) < 0,
  )!;
  const once = new EmitterPlayback(0, 'once', 0, { seed, durationSpread: 1 });
  expect(once.advance(0.01)).toBe(true);
  expect(once.advance(0.01)).toBe(false);

  const delayed = new EmitterPlayback(2, 'once', 0, { seed, startDelaySpread: 1 });
  expect(delayed.emitting).toBe(true);
  expect(delayed.advance(0.01)).toBe(true);
  expect(delayed.normalizedAge).toBeCloseTo((0.01 - propertyVariation(0, seed, 10)) / 2);
});
