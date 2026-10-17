import { expect, it } from 'vitest';

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
