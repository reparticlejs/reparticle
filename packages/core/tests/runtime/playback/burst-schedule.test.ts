import { expect, it } from 'vitest';

import { BurstSchedule } from '#src/runtime/playback/burst-schedule.js';
import { EmitterPlayback } from '#src/runtime/playback/emitter.js';

it('sorts events, includes duplicate times, and consumes each event once', () => {
  const bursts = [
    { time: 0.3, count: 7, countSpread: 0, probability: 1 },
    { time: 0, count: 2, countSpread: 0, probability: 1 },
    { time: 0.3, count: 4, countSpread: 0, probability: 1 },
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
      { time: 0, count: 200, countSpread: 0, probability: 1 },
      { time: 0.1, count: 200, countSpread: 0, probability: 1 },
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
      { time: 0, count: 2, countSpread: 0, probability: 1 },
      { time: 0.2, count: 3, countSpread: 0, probability: 1 },
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
  const schedule = new BurstSchedule(
    [{ time: 0.2, count: 20, countSpread: 0, probability: 1 }],
    100,
  );
  expect(playback.advance(0.1)).toBe(true);
  expect(schedule.next(playback.emissionCycle, playback.emissionTime)).toBe(0);
  expect(playback.advance(0.1)).toBe(false);
});

it('fires decimal-time events at the boundary despite clock rounding', () => {
  const schedule = new BurstSchedule(
    [{ time: 0.3, count: 2, countSpread: 0, probability: 1 }],
    100,
  );
  expect(schedule.next(0, 0.29)).toBe(0);
  expect(schedule.next(0, 0.3 - Number.EPSILON)).toBe(2);
  expect(schedule.next(0, 0.3)).toBe(0);
});

it.each(['once', 'loop'] as const)('handles zero-duration %s playback', (mode) => {
  const playback = new EmitterPlayback(0, mode);
  const schedule = new BurstSchedule(
    [
      { time: 0, count: 2, countSpread: 0, probability: 1 },
      { time: 0.1, count: 9, countSpread: 0, probability: 1 },
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

it('varies counts within integer bounds and repeats the sequence after reset', () => {
  const schedule = new BurstSchedule(
    [{ time: 0, count: 100, countSpread: 20, probability: 1 }],
    1000,
    7,
  );
  const counts = Array.from({ length: 30 }, (_, cycle) => schedule.next(cycle, 0.1));
  expect(counts.every((count) => Number.isInteger(count) && count >= 80 && count <= 120)).toBe(
    true,
  );
  expect(new Set(counts).size).toBeGreaterThan(1);
  schedule.reset();
  expect(Array.from({ length: 30 }, (_, cycle) => schedule.next(cycle, 0.1))).toEqual(counts);
  const other = new BurstSchedule(
    [{ time: 0, count: 100, countSpread: 20, probability: 1 }],
    1000,
    8,
  );
  expect(Array.from({ length: 30 }, (_, cycle) => other.next(cycle, 0.1))).not.toEqual(counts);
});

it('keeps samples independent of step grouping and capacity-dropped requests', () => {
  const bursts = [
    { time: 0, count: 100, countSpread: 20, probability: 1 },
    { time: 0.2, count: 100, countSpread: 20, probability: 1 },
  ];
  const grouped = new BurstSchedule(bursts, 1000, 7);
  const split = new BurstSchedule(bursts, 1000, 7);
  const capped = new BurstSchedule(bursts, 1, 7);
  expect(grouped.next(0, 0.3)).toBe(split.next(0, 0.1) + split.next(0, 0.3));
  expect(capped.next(0, 0.3)).toBe(1);
  expect(grouped.next(1, 0.1)).toBe(split.next(1, 0.1));
  expect(capped.next(0, 0.4)).toBe(0);
});

it('clamps negative samples to zero', () => {
  const schedule = new BurstSchedule(
    [{ time: 0, count: 1, countSpread: 20, probability: 1 }],
    100,
    7,
  );
  const counts = Array.from({ length: 30 }, (_, cycle) => schedule.next(cycle, 0.1));
  expect(counts).toContain(0);
  expect(counts.every((count) => Number.isInteger(count) && count >= 0 && count <= 21)).toBe(true);
});

it.each([0, 1])('honors probability %s exactly across occurrences', (probability) => {
  const schedule = new BurstSchedule([{ time: 0, count: 10, countSpread: 0, probability }], 100, 7);
  const counts = Array.from({ length: 100 }, (_, cycle) => schedule.next(cycle, 0.1));
  expect(counts).toEqual(Array(100).fill(probability * 10));
});

it('replays seeded decisions without changing the count samples of successful bursts', () => {
  const burst = { time: 0, count: 100, countSpread: 20, probability: 0.7 };
  const schedule = new BurstSchedule([burst], 1000, 7);
  const always = new BurstSchedule([{ ...burst, probability: 1 }], 1000, 7);
  const other = new BurstSchedule([burst], 1000, 8);
  const counts = Array.from({ length: 100 }, (_, cycle) => schedule.next(cycle, 0.1));
  const fullCounts = Array.from({ length: 100 }, (_, cycle) => always.next(cycle, 0.1));
  expect(counts).toContain(0);
  expect(counts.some((count) => count > 0)).toBe(true);
  expect(counts.every((count, index) => count === 0 || count === fullCounts[index])).toBe(true);
  expect(Array.from({ length: 100 }, (_, cycle) => other.next(cycle, 0.1))).not.toEqual(counts);
  schedule.reset();
  expect(Array.from({ length: 100 }, (_, cycle) => schedule.next(cycle, 0.1))).toEqual(counts);
});

it('consumes skipped events once and preserves samples when steps group events', () => {
  const bursts = [
    { time: 0, count: 100, countSpread: 20, probability: 0 },
    { time: 0.1, count: 100, countSpread: 20, probability: 0.7 },
    { time: 0.2, count: 100, countSpread: 20, probability: 1 },
  ];
  const grouped = new BurstSchedule(bursts, 1000, 7);
  const split = new BurstSchedule(bursts, 1000, 7);
  expect(split.next(0, 0)).toBe(0);
  expect(split.next(0, 0.05)).toBe(0);
  expect(grouped.next(0, 0.3)).toBe(split.next(0, 0.1) + split.next(0, 0.3));
  expect(grouped.next(0, 0.4)).toBe(0);
  expect(grouped.next(1, 0.3)).toBe(split.next(1, 0.3));
});
