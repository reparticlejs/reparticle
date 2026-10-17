import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { propertyVariation } from '#src/behaviors/property-variation.js';
import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';
import { EmitterPlayback } from '#src/emitter-playback.js';
import { SpawnRate } from '#src/spawn-rate.js';
import { SpawnSchedule } from '#src/spawn-schedule.js';

import skeleton from '../../../docs/effect.example.json';

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

it('samples once at the end and loop at the start of a boundary frame', () => {
  for (const mode of ['once', 'loop'] as const) {
    const clock = new EmitterPlayback(0.2, mode);
    const rate = new SpawnRate(ramp);
    const schedule = new SpawnSchedule(100);
    const counts = [0.1, 0.1, 0.1].map(
      (dt) => schedule.next(clock.advance(dt) ? rate.at(clock.normalizedAge) : 0, dt).count,
    );
    expect(counts).toEqual(mode === 'once' ? [5, 10, 0] : [5, 0, 5]);
    clock.reset();
    expect(clock.normalizedAge).toBe(0);
    expect(clock.advance(0)).toBe(false);
  }
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
  expect([2, 3, 5].map((rate) => schedule.next(rate, 0.1).count)).toEqual([0, 0, 1]);
});

it('accepts rate curves, preserves them during unrelated updates, and allows numeric replacement', () => {
  const source = skeleton.emitters[0]!;
  const config = parseEffectConfig({
    version: 1,
    emitters: [{ ...source, emission: { ...source.emission, rate: ramp } }],
  }).emitters[0];
  expect(updateEmitterConfig(config, { initial: { size: 40 } }).emission.rate).toEqual(ramp);
  expect(updateEmitterConfig(config, { emission: { rate: 25 } }).emission.rate).toBe(25);
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
    expect(updateEmitterConfig(config, { emission: { rate: 10 } }).emission.rateSpread).toBe(
      rateSpread ?? 0,
    );
    expect(() => updateEmitterConfig(config, { emission: { rateSpread: 10 } })).toThrow(ZodError);
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
