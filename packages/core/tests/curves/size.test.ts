import { expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';
import { scalarPropertySchema } from '#src/config/schemas/definition/curve.js';
import { evaluateCurve } from '#src/curves/evaluate-curve.js';
import { sampleCurve } from '#src/curves/sample-curve.js';

import skeleton from '../../../../docs/effect.example.json';

it('interpolates Hermite values with slopes scaled to the segment width', () => {
  const property = scalarPropertySchema.parse({
    points: [
      { time: 0, value: 0, tangent: 0 },
      { time: 0.5, value: 1, tangent: 0 },
      { time: 1, value: 0, tangent: 0 },
    ],
  });
  expect(evaluateCurve(property, 0)).toBe(0);
  expect(evaluateCurve(property, 0.125)).toBe(0.15625);
  expect(evaluateCurve(property, 0.25)).toBe(0.5);
  expect(evaluateCurve(property, 0.5)).toBe(1);
  expect(evaluateCurve(property, 1)).toBe(0);
  const linear = scalarPropertySchema.parse({
    points: [
      { time: 0, value: 0, tangent: 2 },
      { time: 0.5, value: 1, tangent: 2 },
    ],
  });
  expect(evaluateCurve(linear, 0.125)).toBe(0.25);
});

it('supports constants, one-point slopes and signed scale without clamping', () => {
  expect(sampleCurve(1)).toEqual(new Float32Array(65).fill(1));
  const property = scalarPropertySchema.parse({ points: [{ time: 0.5, value: 0, tangent: 2 }] });
  expect(evaluateCurve(property, 0)).toBe(-1);
  expect(evaluateCurve(property, 1)).toBe(1);
});

it('bakes 64 linear segments with both lifetime endpoints', () => {
  const property = scalarPropertySchema.parse({
    points: [
      { time: 0, value: 1, tangent: -1 },
      { time: 1, value: 0, tangent: -1 },
    ],
  });
  const samples = sampleCurve(property);
  expect(samples).toHaveLength(65);
  for (let index = 0; index <= 64; index++) {
    expect(samples[index]).toBe(1 - index / 64);
  }
});

it.each([
  { points: [] },
  { points: [{ time: -1, value: 1 }] },
  { points: [{ time: 1.1, value: 1 }] },
  { points: [{ time: 0, value: NaN }] },
  { points: [{ time: 0, value: 1, tangent: Infinity }] },
  {
    points: [
      { time: 0.5, value: 1 },
      { time: 0.5, value: 0 },
    ],
  },
  {
    points: [
      { time: 1, value: 1 },
      { time: 0, value: 0 },
    ],
  },
  { points: [{ time: 0, value: 1, typo: 1 }] },
])('rejects invalid curves: %j', (property) => {
  expect(scalarPropertySchema.safeParse(property).success).toBe(false);
});

it('rejects samples that overflow GPU float precision', () => {
  expect(() => sampleCurve(1e100)).toThrow(RangeError);
});

it('defaults old definitions to size 24 and constant scale 1', () => {
  const emitter = skeleton.emitters[0]!;
  const effect = parseEffectConfig({
    version: 1,
    emitters: [
      {
        ...emitter,
        initial: { ...emitter.initial, size: undefined },
        overLifetime: undefined,
      },
    ],
  });
  expect(effect.emitters[0].initial.size).toBe(24);
  expect(effect.emitters[0].overLifetime.scale).toBe(1);
});

it('updates initial size atomically without resetting it on unrelated patches', () => {
  const original = parseEffectConfig(skeleton).emitters[0];
  const changed = applyEmitterPatch(original, { initial: { size: 48 } });
  expect(applyEmitterPatch(changed, { initial: { speed: 50 } }).initial.size).toBe(48);
  expect(original.initial.size).toBe(24);
  expect(applyEmitterPatch(changed, { initial: { size: -1 } }).initial.size).toBe(-1);
  expect(() => applyEmitterPatch(changed, { overLifetime: { scale: 0 } })).toThrow(ZodError);
});
