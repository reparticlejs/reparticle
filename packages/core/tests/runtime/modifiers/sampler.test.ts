import { expect, it } from 'vitest';

import { ModifierSampler } from '#runtime/modifiers/sampler.js';
import { EffectTransform } from '#runtime/transforms/effect.js';
import { applyModifiers } from '#test-support/simulation';

const identity = new EffectTransform();
const sample = (local: unknown, shared: unknown = []) =>
  new ModifierSampler(local, shared).sample(0, false, 0, 0, 0, 1, identity);
const advance = (values: Float32Array, x = 10, y = 0, vx = 10, vy = 0, factor = 0) =>
  applyModifiers(x, y, vx, vy, 0, -1, factor, 0.1, values);

it('executes repeated accelerations and drags sequentially in authored order', () => {
  const acceleration = { type: 'acceleration', magnitude: 100, rotation: -90 };
  const drag = { type: 'drag', magnitude: 5 };
  expect(advance(sample([acceleration, drag, acceleration, drag]))[0]).toBeCloseTo(10);
  expect(advance(sample([drag, drag, acceleration, acceleration]))[0]).toBeCloseTo(22.5);
});

it('executes emitter modifiers first, followed by shared modifiers without sorting by type', () => {
  const acceleration = { type: 'acceleration', magnitude: 100, rotation: -90 };
  const drag = { type: 'drag', magnitude: 5 };
  expect(advance(sample([drag], [acceleration, drag]))[0]).toBeCloseTo(7.5);
  expect(advance(sample([acceleration], [drag, drag]))[0]).toBeCloseTo(5);
});

it('retains independent centers and cutoffs for repeated radial and vortex modifiers', () => {
  const modifiers = [
    { type: 'radial', x: 0, magnitude: 20, maxDistance: 10 },
    { type: 'radial', x: 20, magnitude: 10, maxDistance: 10 },
    { type: 'vortex', x: 0, magnitude: 30, maxDistance: 10 },
    { type: 'vortex', x: 20, magnitude: 10, maxDistance: 9 },
  ];
  const velocity = advance(sample(modifiers), 10, 0, 0, 0);
  expect(velocity[0]).toBeCloseTo(1);
  expect(velocity[1]).toBeCloseTo(-3);
});

it('samples every curve on the receiving emitter timeline using one stable particle spread factor', () => {
  const curve = {
    points: [
      { time: 0, value: 0, tangent: 20 },
      { time: 1, value: 20, tangent: 20 },
    ],
  };
  const list = new ModifierSampler(
    [{ type: 'acceleration', magnitude: curve, spread: 4 }],
    [{ type: 'acceleration', magnitude: curve, spread: 8 }],
  );
  const first = advance(list.sample(0.25, false, 0, 0, 0, 1, identity), 0, 0, 0, 0, 0.5);
  const second = advance(list.sample(0.75, false, 0, 0, 0, 1, identity), 0, 0, 0, 0, 0.5);
  expect(first[1]).toBeCloseTo(-1.6);
  expect(second[1]).toBeCloseTo(-3.6);
});

it('transforms shared centers into local space without moving emitter-local centers', () => {
  const modifiers = new ModifierSampler(
    [{ type: 'radial', x: 1, magnitude: 1 }],
    [{ type: 'radial', x: 10, y: 20, magnitude: 30, maxDistance: 80 }],
  );
  const values = modifiers.sample(0, true, 10, 0, 90, 2, identity);
  expect(values[5]).toBe(1);
  expect(values[17]).toBeCloseTo(-10);
  expect(values[18]).toBeCloseTo(0);
  expect(values[21]).toBe(40);
  expect(values[15]).toBe(15);
});

it('handles negative and collapsed local scale and restores the shared list afterward', () => {
  const modifiers = new ModifierSampler([], [{ type: 'radial', magnitude: 10 }]);
  const reversed = modifiers.sample(0, true, 0, 0, 0, -2, identity);
  expect(advance(reversed, -1, 0, 0, 0)[0]).toBeCloseTo(-0.5);
  expect(modifiers.sample(0, true, 0, 0, 0, 0, identity)[0]).toBe(0);
  expect(modifiers.sample(0, true, 0, 0, 0, 1, identity)[0]).toBe(1);
});

it('handles empty lists and the full supported list without dropping entries', () => {
  expect([...advance(sample([]))]).toEqual([10, 0]);
  const entries = Array.from({ length: 64 }, () => ({ type: 'acceleration', magnitude: 1 }));
  const values = sample(entries, entries);
  expect(values[0]).toBe(128);
  expect(advance(values)[1]).toBeCloseTo(-12.8);
});

it.each(['local', 'shared'])(
  'reflects %s forces and centers including vortex handedness',
  (scope) => {
    const definitions = [
      { type: 'acceleration', magnitude: 10, rotation: 35, spread: 3 },
      { type: 'noise', magnitude: 30, scale: 70, seed: 42, spread: 5 },
      { type: 'drag', magnitude: 2, rotation: 20, useDirection: true },
      { type: 'radial', x: 3, y: 5, magnitude: 4, maxDistance: 50 },
      { type: 'vortex', x: 3, y: 5, magnitude: 6, maxDistance: 50, rotation: 15 },
    ];
    const list = new ModifierSampler(
      scope === 'local' ? definitions : [],
      scope === 'shared' ? definitions : [],
    );
    const effect = new EffectTransform();
    for (const [x, y] of [
      [12, 8],
      [3, 5],
    ]) {
      effect.handedness = 1;
      const normal = advance(list.sample(0, false, 0, 0, 0, 1, effect), x, y, 7, 9, 0.5);
      effect.handedness = -1;
      const reflected = advance(list.sample(0, false, 0, 0, 0, 1, effect), -x!, y, -7, 9, 0.5);
      expect(reflected[0]).toBeCloseTo(-normal[0]);
      expect(reflected[1]).toBeCloseTo(normal[1]);
    }
  },
);

it('keeps local-space forces unchanged when the whole effect is reflected', () => {
  const list = new ModifierSampler(
    [{ type: 'acceleration', rotation: 30, magnitude: 4 }],
    [{ type: 'vortex', x: 12, magnitude: 6 }],
  );
  const effect = new EffectTransform();
  const normal = list.sample(0, true, 5, 3, 40, 2, effect).slice();
  effect.handedness = -1;
  expect(list.sample(0, true, 5, 3, 40, 2, effect)).toEqual(normal);
});

it('uses continuous seconds for noise while magnitude keeps the modifier clock', () => {
  const list = new ModifierSampler([{ type: 'noise', magnitude: 40, speed: 0.5, seed: 9 }]);
  const before = list.sample(0.99, false, 0, 0, 0, 1, identity, 1.99).slice();
  const after = list.sample(0.01, false, 0, 0, 0, 1, identity, 2.01).slice();
  expect(before[12]).toBeCloseTo(0.995);
  expect(after[12]).toBeCloseTo(1.005);
  expect(after[13]).toBe(9);
  expect(advance(before)).not.toEqual(advance(after));
  const frozen = new ModifierSampler([{ type: 'noise', magnitude: 40, speed: 0 }]);
  const first = frozen.sample(0, false, 0, 0, 0, 1, identity, 0).slice();
  expect(frozen.sample(0, false, 0, 0, 0, 1, identity, 100)).toEqual(first);
});
