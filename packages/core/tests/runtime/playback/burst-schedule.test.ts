import { expect, it } from 'vitest';

import { BurstSchedule } from '#src/runtime/playback/burst-schedule.js';
import { EmitterPlayback } from '#src/runtime/playback/emitter.js';

it('sorts events, includes duplicate times, and consumes each event once', () => {
  const bursts = [
    { time: 0.3, count: 7 },
    { time: 0, count: 2 },
    { time: 0.3, count: 4 },
  ];
  const schedule = new BurstSchedule(bursts, 100);
  expect(schedule.next(0, 0.1)).toBe(2);
  expect(schedule.next(0, 0.2)).toBe(0);
  expect(schedule.next(0, 0.3)).toBe(11);
  expect(schedule.next(0, 0.4)).toBe(0);
  expect(bursts[0]?.time).toBe(0.3);
  expect(schedule.next(1, 0.1)).toBe(2);
  schedule.reset();
  expect(schedule.next(0, 0.1)).toBe(2);
});

it('drops excess births without deferring them', () => {
  const schedule = new BurstSchedule(
    [
      { time: 0, count: 200 },
      { time: 0.1, count: 200 },
    ],
    10,
  );
  expect(schedule.next(0, 0.1)).toBe(10);
  expect(schedule.next(0, 0.2)).toBe(0);
});

it('keeps boundary events in the ending cycle and delays the next time-zero burst', () => {
  const playback = new EmitterPlayback(0.2, 'loop', 0.1);
  const schedule = new BurstSchedule(
    [
      { time: 0, count: 2 },
      { time: 0.2, count: 3 },
    ],
    100,
  );
  function advance(seconds: number) {
    return playback.advance(seconds)
      ? schedule.next(playback.emissionCycle, playback.emissionTime)
      : 0;
  }
  expect(advance(0)).toBe(0);
  expect(advance(0.1)).toBe(0);
  expect(advance(0.1)).toBe(2);
  expect(advance(0.1)).toBe(3);
  expect(advance(0.1)).toBe(2);
  playback.retire();
  expect(advance(0.1)).toBe(3);
  expect(advance(0.1)).toBe(0);
});

it('does not schedule events after the end of a once emitter', () => {
  const playback = new EmitterPlayback(0.1, 'once');
  const schedule = new BurstSchedule([{ time: 0.2, count: 20 }], 100);
  expect(playback.advance(0.1)).toBe(true);
  expect(schedule.next(playback.emissionCycle, playback.emissionTime)).toBe(0);
  expect(playback.advance(0.1)).toBe(false);
});

it('fires decimal-time events at the boundary despite clock rounding', () => {
  const schedule = new BurstSchedule([{ time: 0.3, count: 2 }], 100);
  expect(schedule.next(0, 0.29)).toBe(0);
  expect(schedule.next(0, 0.3 - Number.EPSILON)).toBe(2);
  expect(schedule.next(0, 0.3)).toBe(0);
});

it.each(['once', 'loop'] as const)('handles zero-duration %s playback', (mode) => {
  const playback = new EmitterPlayback(0, mode);
  const schedule = new BurstSchedule(
    [
      { time: 0, count: 2 },
      { time: 0.1, count: 9 },
    ],
    100,
  );
  expect(playback.advance(0)).toBe(false);
  expect(playback.advance(0.01)).toBe(true);
  expect(schedule.next(playback.emissionCycle, playback.emissionTime)).toBe(2);
  const emitting = playback.advance(0.01);
  const births = emitting ? schedule.next(playback.emissionCycle, playback.emissionTime) : 0;
  expect(emitting).toBe(mode === 'loop');
  expect(births).toBe(mode === 'loop' ? 2 : 0);
});
