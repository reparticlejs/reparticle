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
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
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

it('captures signed size and rotation independently, adds orientation, and resamples on reuse', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0, 0, 0, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 1 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const run = (
    seed: number,
    spawn: number,
    orient: number,
    sizeSpread: number,
    rotationSpread: number,
  ) =>
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
      10,
      1,
      1,
      1,
      1,
      30,
      orient,
      0,
      0,
      sizeSpread,
      rotationSpread,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
    );
  expect(run(1, 1, 0, 0, 0)).toEqual([0, 1, 10, 30]);
  const sizes: number[] = [];
  const rotations: number[] = [];
  for (let seed = 0; seed < 100; seed++) {
    const born = run(seed, 1, 0, 20, 720);
    sizes.push(born[2]);
    rotations.push(born[3]);
    expect(run(seed, 1, 1, 20, 720)[3]).toBeCloseTo(born[3] - 90);
    state[1]![0] = born;
    expect(run(seed + 1, 0, 0, 0, 0).slice(2)).toEqual(born.slice(2));
  }
  expect(Math.min(...sizes)).toBeLessThan(0);
  expect(Math.max(...sizes)).toBeLessThanOrEqual(30);
  expect(Math.min(...rotations)).toBeLessThan(-360);
  expect(Math.max(...rotations)).toBeGreaterThan(360);
  expect(
    sizes.some((size, index) => Math.abs((size - 10) / 20 - (rotations[index]! - 30) / 720) > 0.1),
  ).toBe(true);
  expect(run(1, 1, 0, 20, 720)).not.toEqual(run(2, 1, 0, 20, 720));
});

it('samples RGBA independently without birth clamping and retains values until reuse', () => {
  const state: ParticleTexture = [[[0, 0, 0, 0]], [[0, 1, 24, 0]], [[0, 0, 0, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 2 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const run = (seed: number, spawn: number, spread: number) =>
    integrate.call(
      context,
      state,
      0.1,
      0,
      spawn,
      0,
      0,
      0,
      0,
      0,
      0,
      1,
      seed,
      0,
      0,
      0,
      24,
      0.5,
      0.5,
      0.5,
      0.5,
      0,
      0,
      0,
      0,
      0,
      0,
      spread,
      spread,
      spread,
      spread,
      0,
      0,
      0,
      0,
      1,
      0,
      1,
    );
  expect(run(1, 1, 0)).toEqual([0.5, 0.5, 0.5, 0.5]);
  const samples = Array.from({ length: 100 }, (_, seed) => run(seed, 1, 1));
  for (let channel = 0; channel < 4; channel++) {
    const values = samples.map((sample) => sample[channel]!);
    expect(Math.min(...values)).toBeLessThan(0);
    expect(Math.max(...values)).toBeGreaterThan(1);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-0.5);
    expect(Math.max(...values)).toBeLessThanOrEqual(1.5);
  }
  expect(new Set(samples[0]).size).toBe(4);
  state[2]![0] = samples[0]!;
  expect(run(1, 0, 0)).toEqual(samples[0]);
  expect(run(0, 1, 1)).toEqual(samples[0]);
  expect(run(1, 1, 1)).not.toEqual(samples[0]);
});
