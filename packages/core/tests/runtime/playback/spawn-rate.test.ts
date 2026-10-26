import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';
import { EmitterPlayback } from '#src/runtime/playback/emitter.js';
import { SpawnRate } from '#src/runtime/playback/spawn-rate.js';
import { SpawnSchedule } from '#src/runtime/playback/spawn-schedule.js';
import { propertyVariation } from '#src/simulation/emission/variation.js';

import skeleton from '../../../../../docs/effect.example.json';

const ramp = {
  points: [
    { time: 0, value: 0, tangent: 100 },
    { time: 1, value: 100, tangent: 100 },
  ],
};

it('samples absolute rates and clamps negative values after interpolation', () => {
  const rate = new SpawnRate(ramp);
  expect(rate.at(0)).toBe(0);
  expect(rate.at(0.25)).toBe(25);
  expect(rate.at(1)).toBe(100);
  expect(new SpawnRate(-10).at(0.5)).toBe(0);
  expect(
    new SpawnRate({
      points: [
        { time: 0, value: -50, tangent: 100 },
        { time: 1, value: 50, tangent: 100 },
      ],
    }).at(0.25),
  ).toBe(0);
  expect(() => new SpawnRate(1e100)).toThrow(RangeError);
});

it('integrates the consumed interval before wrapping a loop', () => {
  for (const mode of ['once', 'loop'] as const) {
    const clock = new EmitterPlayback(0.2, mode);
    const rate = new SpawnRate(ramp);
    const schedule = new SpawnSchedule(100);
    const counts = [0.1, 0.1, 0.1].map((dt) =>
      schedule.next(
        clock.advance(dt) ? rate.average(clock.emissionStartAge, clock.emissionEndAge) : 0,
        dt,
      ),
    );
    expect(counts).toEqual(mode === 'once' ? [2, 8, 0] : [2, 8, 2]);
    clock.reset();
    expect(clock.emissionStartAge).toBe(0);
    expect(clock.emissionEndAge).toBe(0);
    expect(clock.advance(0)).toBe(false);
  }
});

it('integrates only positive rates including a zero crossing inside a sample segment', () => {
  const rate = new SpawnRate({
    points: [
      { time: 0, value: -49.5, tangent: 100 },
      { time: 1, value: 50.5, tangent: 100 },
    ],
  });
  expect(rate.average(0, 1)).toBeCloseTo((50.5 * 0.505) / 2, 8);
  expect(new SpawnRate(25).average(0, 1)).toBe(25);
  expect(new SpawnRate(-25).average(0, 1)).toBe(0);
  expect(new SpawnRate(25).average(0, 0)).toBe(25);
});

it('waits for start delay, samples zero duration at zero, and retains fractional emission', () => {
  const clock = new EmitterPlayback(1, 'once', 0.2);
  expect(clock.advance(0.1)).toBe(false);
  expect(clock.advance(0.1)).toBe(false);
  expect(clock.advance(0.1)).toBe(true);
  expect(clock.normalizedAge).toBeCloseTo(0.1);
  const zero = new EmitterPlayback(0, 'once');
  expect(zero.advance(0.1)).toBe(true);
  expect(zero.normalizedAge).toBe(0);
  const schedule = new SpawnSchedule(100);
  expect([2, 3, 5].map((rate) => schedule.next(rate, 0.1))).toEqual([0, 0, 1]);
});

it('accepts rate curves, preserves them during unrelated updates, and allows numeric replacement', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...source, emission: { ...source.emission, rate: ramp } }],
  }).emitters[0];
  expect(applyEmitterPatch(config, { initial: { size: 40 } }).emission.rate).toEqual(ramp);
  expect(applyEmitterPatch(config, { emission: { rate: 25 } }).emission.rate).toBe(25);
});

it('adds one seeded offset before clamping, including negative curve values', () => {
  for (const seed of [0, 1, 42, 65535]) {
    const offset = propertyVariation(0, seed, 11) * 100;
    const rate = new SpawnRate(ramp, 100, seed);
    for (const age of [0, 0.25, 0.5, 1, 0, 1]) {
      expect(rate.at(age)).toBeCloseTo(Math.max(0, age * 100 + offset));
    }
    expect(new SpawnRate(-10, 100, seed).at(0)).toBe(Math.max(0, -10 + offset));
    expect(new SpawnRate(25, 100, seed).at(0.5)).toBe(Math.max(0, 25 + offset));
  }
});

it('validates rate spread, defaults to zero, and requires recreation to change it', () => {
  const source = skeleton.emitters[0]!;
  for (const rateSpread of [undefined, 0, 50]) {
    const config = parseEffectConfig({
      version: 1,
      emitters: [{ ...source, emission: { ...source.emission, rateSpread } }],
    }).emitters[0];
    expect(config.emission.rateSpread).toBe(rateSpread ?? 0);
    expect(applyEmitterPatch(config, { emission: { rate: 10 } }).emission.rateSpread).toBe(
      rateSpread ?? 0,
    );
    expect(() => applyEmitterPatch(config, { emission: { rateSpread: 10 } })).toThrow(ZodError);
  }
  for (const rateSpread of [-1, NaN, Infinity, '1', null]) {
    expect(() =>
      parseEffectConfig({
        version: 1,
        emitters: [{ ...source, emission: { ...source.emission, rateSpread } }],
      }),
    ).toThrow(ZodError);
  }
});
