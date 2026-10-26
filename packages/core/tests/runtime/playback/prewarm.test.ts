import { expect, it } from 'vitest';

import { EmitterPlayback } from '#runtime/playback/emitter.js';
import { prewarm } from '#runtime/playback/prewarm.js';
import { SpawnSchedule } from '#runtime/playback/spawn-schedule.js';

it.each([0, 0.00001])('skips offsets below the prewarm threshold: %s', (offset) => {
  const steps: number[] = [];
  prewarm(offset, 2, (seconds) => steps.push(seconds));
  expect(steps).toEqual([]);
});

it('uses complete float32 60 Hz steps, including the final partial interval', () => {
  const steps: number[] = [];
  prewarm(0.02, 2, (seconds) => steps.push(seconds));
  expect(steps).toEqual([Math.fround(1 / 60), Math.fround(1 / 60)]);
});

it('caps the simulated time at particle lifetime', () => {
  const steps: number[] = [];
  prewarm(5, 0.05, (seconds) => steps.push(seconds));
  expect(steps).toHaveLength(3);
});

it('includes start delay in the prewarm time', () => {
  const playback = new EmitterPlayback(1, 'loop', 0.1);
  const schedule = new SpawnSchedule(100);
  let births = 0;
  prewarm(0.05, 1, (seconds) => {
    births += schedule.next(playback.advance(seconds) ? 60 : 0, seconds);
  });
  expect(births).toBe(0);
  expect(playback.emitting).toBe(false);
});

it('can finish once playback during prewarm', () => {
  const playback = new EmitterPlayback(0.05, 'once');
  const schedule = new SpawnSchedule(100);
  let births = 0;
  prewarm(0.1, 1, (seconds) => {
    births += schedule.next(playback.advance(seconds) ? 60 : 0, seconds);
  });
  expect(births).toBe(3);
  expect(playback.emitting).toBe(false);
});
