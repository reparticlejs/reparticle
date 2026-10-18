import { expect, it } from 'vitest';

import { applySharedModifiers } from '#src/behaviors/shared-modifiers.js';
import { SharedModifiers } from '#src/shared-modifiers.js';

it('applies acceleration before drag, then radial and vortex in the shared scope', () => {
  const shared = new SharedModifiers({
    acceleration: { magnitude: 10, rotation: -90 },
    drag: { magnitude: 5 },
    radial: { magnitude: 20 },
    vortex: { magnitude: 30 },
  });
  const values = shared.sample(0, false, 10, 20, 90, 3);
  const velocity = applySharedModifiers(10, 0, 10, 0, 0, -1, 0, 0.1, values);
  expect(velocity[0]).toBeCloseTo(7.5); // (10 + 1) * 0.5 + 2
  expect(velocity[1]).toBeCloseTo(-3);
});

it('keeps shared centers and directions in effect space across emitter transforms', () => {
  const shared = new SharedModifiers({
    radial: { x: 10, y: 20, magnitude: 30, maxDistance: 80 },
    acceleration: { magnitude: 10 },
  });
  const world = [...shared.sample(0, false, 100, 200, 90, 2)];
  expect(world.slice(12, 15)).toEqual([10, 20, 80]);
  const local = shared.sample(0, true, 10, 0, 90, 2);
  expect(local[12]).toBeCloseTo(-10);
  expect(local[13]).toBeCloseTo(0);
  expect(local[14]).toBe(40);
  expect(applySharedModifiers(0, 0, 0, 0, 0, -1, 0, 0.1, local)[0]).toBeCloseTo(2);
});

it('samples curves per emitter timeline and retains particle spread factors', () => {
  const shared = new SharedModifiers({
    acceleration: {
      magnitude: {
        points: [
          { time: 0, value: 0, tangent: 20 },
          { time: 1, value: 20, tangent: 20 },
        ],
      },
      spread: 4,
    },
  });
  const first = applySharedModifiers(
    0,
    0,
    0,
    0,
    0,
    -1,
    0.5,
    0.1,
    shared.sample(0.25, false, 0, 0, 0, 1),
  );
  const second = applySharedModifiers(
    0,
    0,
    0,
    0,
    0,
    -1,
    0.5,
    0.1,
    shared.sample(0.75, false, 0, 0, 0, 1),
  );
  expect(first[1]).toBeCloseTo(-0.7);
  expect(second[1]).toBeCloseTo(-1.7);
});

it('handles negative and collapsed local scale without nonfinite values', () => {
  const shared = new SharedModifiers({ radial: { magnitude: 10 } });
  const values = shared.sample(0, true, 0, 0, 0, -2);
  expect(values[10]).toBe(5);
  expect(applySharedModifiers(-1, 0, 0, 0, 0, -1, 0, 0.1, values)[0]).toBe(-0.5);
  expect([...shared.sample(0, true, 0, 0, 0, 0)]).toEqual(Array(24).fill(0));
  const vortex = new SharedModifiers({ vortex: { magnitude: 10 } });
  const reversed = vortex.sample(0, true, 0, 0, 0, -2);
  expect(applySharedModifiers(0, 0, 0, 0, 0, -1, 0, 0.1, reversed)[0]).toBe(0.5);
});
