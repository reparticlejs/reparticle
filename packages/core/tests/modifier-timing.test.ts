import { expect, it } from 'vitest';

import { propertyVariation } from '#src/behaviors/property-variation.js';
import { SampledCurve } from '#src/curves/sampled-curve.js';
import { EffectTransform } from '#src/effect-transform.js';
import { EmitterPlayback } from '#src/emitter-playback.js';
import { Modifiers } from '#src/modifiers.js';

const ramp = {
  points: [
    { time: 0, value: 10, tangent: 20 },
    { time: 1, value: 30, tangent: 20 },
  ],
};
const identity = new EffectTransform();

it.each([0, 1, 42])('separates authored and sampled clocks for seed %s', (seed) => {
  const sampledDuration = 1 + propertyVariation(0, seed, 9) * 0.8;
  const playback = new EmitterPlayback(1, 'once', 0, { seed, durationSpread: 0.8 });
  playback.advance(0.1);
  expect(playback.modifierAge).toBeCloseTo(0.1);
  expect(playback.normalizedAge).toBeCloseTo(0.1 / sampledDuration);
  playback.advance(2);
  expect(playback.modifierAge).toBeCloseTo(sampledDuration);
  expect(playback.normalizedAge).toBe(1);
  playback.advance(10);
  expect(playback.modifierAge).toBeCloseTo(sampledDuration);
});

it.each(['acceleration', 'drag', 'radial', 'vortex'] as const)(
  'extrapolates local and shared %s magnitudes beyond authored duration',
  (type) => {
    const modifiers = new Modifiers([{ type, magnitude: ramp }], [{ type, magnitude: ramp }]);
    const values = modifiers.sample(1.5, false, 0, 0, 0, 1, identity);
    expect(values[3]).toBeCloseTo(40);
    expect(values[12]).toBeCloseTo(40);
    expect(new SampledCurve(ramp).at(1.5)).toBe(30);
  },
);

it('extrapolates the last sampled line rather than the authored Hermite polynomial', () => {
  const curve = new SampledCurve({
    points: [
      { time: 0, value: 0, tangent: 0 },
      { time: 1, value: 1, tangent: 0 },
    ],
  });
  const slope = (curve.at(1) - curve.at(63 / 64)) * 64;
  expect(curve.extrapolate(1.5)).toBeCloseTo(1 + slope * 0.5);
  expect(curve.extrapolate(1.5)).toBeGreaterThan(1);
  expect(new SampledCurve(7).extrapolate(10)).toBe(7);
});

it('advances the modifier clock during draining and holds at sampled duration', () => {
  const playback = new EmitterPlayback(1, 'once', 0, { seed: 42, durationSpread: 0.8 });
  const duration = 1 + propertyVariation(0, 42, 9) * 0.8;
  const modifiers = new Modifiers([{ type: 'acceleration', magnitude: ramp }]);
  playback.advance(0.1);
  playback.stop();
  playback.advance(0.1);
  expect(playback.modifierAge).toBeCloseTo(0.2);
  playback.advance(2);
  expect(modifiers.sample(playback.modifierAge, false, 0, 0, 0, 1, identity)[3]).toBeCloseTo(
    10 + 20 * duration,
  );
  playback.advance(2);
  expect(playback.modifierAge).toBeCloseTo(duration);
});

it('wraps both clocks together and preserves the final modifier sample on retirement', () => {
  const playback = new EmitterPlayback(1, 'loop', 0, { seed: 42, durationSpread: 0.8 });
  const duration = 1 + propertyVariation(0, 42, 9) * 0.8;
  playback.advance(2);
  expect(playback.modifierAge).toBe(0);
  expect(playback.normalizedAge).toBe(0);
  playback.retire();
  playback.advance(2);
  expect(playback.modifierAge).toBeCloseTo(duration);
  playback.reset();
  expect(playback.modifierAge).toBe(0);
});

it('subtracts start delay before sampling the spawning frame and preserves zero-time samples', () => {
  const playback = new EmitterPlayback(1, 'once', 0.25);
  playback.advance(0.3);
  playback.advance(0.1);
  expect(playback.modifierAge).toBeCloseTo(0.15);
  playback.advance(0);
  expect(playback.modifierAge).toBeCloseTo(0.15);
});

it('samples modifiers at zero for authored zero duration, even with positive duration spread', () => {
  const seed = Array.from({ length: 100 }, (_, index) => index).find(
    (value) => propertyVariation(0, value, 9) > 0.5,
  )!;
  const playback = new EmitterPlayback(0, 'once', 0, { seed, durationSpread: 1 });
  playback.advance(0.1);
  expect(playback.normalizedAge).toBeGreaterThan(0);
  expect(playback.modifierAge).toBe(0);
  playback.advance(2);
  expect(playback.modifierAge).toBe(0);
});
