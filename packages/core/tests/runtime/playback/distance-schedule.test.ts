import { expect, it } from 'vitest';

import { DistanceSchedule } from '#src/runtime/playback/distance-schedule.js';

it('establishes the first position and emits nothing while stationary', () => {
  const schedule = new DistanceSchedule(100);
  expect(schedule.next(100, 200, 2)).toBe(0);
  expect(schedule.next(100, 200, 2)).toBe(0);
  expect(schedule.next(103, 204, 2)).toBe(10);
  expect(schedule.firstBirthFraction).toBeCloseTo(0.1);
  expect(schedule.birthFractionStep).toBeCloseTo(0.1);
});

it('preserves spacing across differently sized segments and turns', () => {
  const schedule = new DistanceSchedule(100);
  schedule.next(0, 0, 0.5);
  expect(schedule.next(1, 0, 0.5)).toBe(0);
  expect(schedule.next(1, 3, 0.5)).toBe(2);
  expect(schedule.firstBirthFraction).toBeCloseTo(1 / 3);
  expect(schedule.birthFractionStep).toBeCloseTo(2 / 3);
  expect(schedule.next(1, 4, 0.5)).toBe(0);
  expect(schedule.next(1, 5, 0.5)).toBe(1);
});

it('drops capacity overflow, tracks disabled motion, and resets position history', () => {
  const schedule = new DistanceSchedule(3);
  schedule.next(0, 0, 1);
  expect(schedule.next(100, 0, 1)).toBe(3);
  expect(schedule.next(100, 0, 1)).toBe(0);
  expect(schedule.next(200, 0, 0)).toBe(0);
  expect(schedule.next(201, 0, 1)).toBe(1);
  schedule.reset();
  expect(schedule.next(500, 0, 1)).toBe(0);
});
