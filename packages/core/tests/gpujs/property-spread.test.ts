import { expect, it } from 'vitest';

import { integrate } from '#src/gpujs/integrate.js';
import type { KernelContext, ParticleTexture } from '#types/layout.js';

it('samples independent signed speed and lifetime offsets once per birth', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0, 0, 0, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const run = (seed: number, spawn: number, speedSpread: number, lifetimeSpread: number) =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      spawn,
      0,
      0,
      10,
      0,
      0,
      0,
      1,
      seed,
      0,
      0,
      0,
      24,
      1,
      1,
      1,
      1,
      0,
      0,
      speedSpread,
      lifetimeSpread,
    );
  const speeds: number[] = [];
  const lifetimes: number[] = [];
  for (let seed = 0; seed < 100; seed++) {
    context.thread.y = 0;
    const motion = run(seed, 1, 20, 2);
    expect(run(seed, 1, 20, 2)).toEqual(motion);
    speeds.push(motion[2]);
    context.thread.y = 1;
    const properties = run(seed, 1, 20, 2);
    lifetimes.push(properties[1]);
    state[1]![0] = properties;
    expect(run(seed, 0, 0, 0)[1]).toBe(properties[1]);
  }
  expect(Math.min(...speeds)).toBeLessThan(0);
  expect(Math.max(...speeds)).toBeLessThanOrEqual(30);
  expect(Math.min(...lifetimes)).toBeLessThan(0);
  expect(Math.max(...lifetimes)).toBeLessThanOrEqual(3);
  expect(
    lifetimes.some((value, index) => Math.abs((speeds[index]! - 10) / 20 - (value - 1) / 2) > 0.1),
  ).toBe(true);
});
