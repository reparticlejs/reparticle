import { describe, expect, it } from 'vitest';

import { SpawnSchedule } from '#src/runtime/spawn-schedule.js';
describe('spawn scheduling', () => {
  it('retains fractional emission across frames', () => {
    const schedule = new SpawnSchedule(1000);
    let count = 0;
    for (let i = 0; i < 60; i++) {
      count += schedule.next(140, 1 / 60);
    }
    expect(count).toBe(140);
  });
  it('caps requests per frame without queuing excess', () => {
    const schedule = new SpawnSchedule(10);
    expect(schedule.next(80, 0.1)).toEqual(8);
    expect(schedule.next(50, 0.1)).toEqual(5);
    expect(schedule.next(1000, 0.1)).toEqual(10);
  });
  it('clears carry on reset', () => {
    const schedule = new SpawnSchedule(10);
    schedule.next(15, 0.1);
    schedule.reset();
    expect(schedule.next(5, 0.1)).toEqual(0);
  });
  it('rejects invalid inputs before scheduling', () => {
    expect(() => new SpawnSchedule(0)).toThrow(RangeError);
    expect(() => new SpawnSchedule(1_000_001)).toThrow(RangeError);
    const schedule = new SpawnSchedule(10);
    for (const dt of [-1, NaN, Infinity, 0.2]) {
      expect(() => schedule.next(10, dt)).toThrow(RangeError);
    }
  });
});
