import { expect, it } from "vitest";
import {
  advancePosition,
  advancePositionWithGravity,
  advanceVelocity,
} from "#src/behaviors/motion.js";
import { spawnDirection, spawnVariation } from "#src/behaviors/spawn.js";
import { spawnMotion } from "#src/gpujs/spawn-motion.js";
import { integrate } from "#src/gpujs/integrate.js";
import type { KernelContext, ParticleTexture } from "#src/gpujs/layout.js";

it("integrates gravity equivalently over one step and ten smaller steps", () => {
  let position = 10,
    velocity = -30;
  for (let step = 0; step < 10; step++) {
    position = advancePositionWithGravity(position, velocity, 100, 0.05);
    velocity = advanceVelocity(velocity, 100, 0.05);
  }
  expect(position).toBeCloseTo(advancePositionWithGravity(10, -30, 100, 0.5), 10);
  expect(velocity).toBeCloseTo(20, 10);
  expect(advancePosition(10, -30, 0.5)).toBe(-5);
});
it("keeps spawn direction within its range and scalar speed exact", () => {
  for (let id = 0; id < 100; id++) {
    const variation = spawnVariation(id, 1);
    expect(variation).toBeGreaterThanOrEqual(0);
    expect(variation).toBeLessThan(1);
    expect(spawnVariation(id, 1)).toBe(variation);
    expect(spawnDirection(0, 2, variation)).toBeGreaterThanOrEqual(-1);
    expect(spawnDirection(0, 2, variation)).toBeLessThan(1);
    const [, , vx, vy] = spawnMotion(id, 1, 0, 0, 100, 0, 2);
    expect(Math.hypot(vx, vy)).toBeCloseTo(100, 10);
  }
});
it("maps motion and lifetime texels without changing the behavior math", () => {
  const state: ParticleTexture = [[[10, 20, 30, -40]], [[0.5, 2, 1, 0]]];
  const context: KernelContext = {
    thread: { x: 0, y: 0 },
    constants: { width: 1, rows: 1, capacity: 1 },
  };
  const step = () => integrate.call(context, state, 0.1, 0, 0, 0, 0, 100, 0, 1, 100, 2, 1);
  expect(step()).toEqual([13, 16.5, 30, -30]);
  context.thread.y = 1;
  expect(step()).toEqual([0.6, 2, 1, 0]);
  context.thread.y = 0;
  state[1]![0]![0] = 3;
  expect(step()).toEqual([10, 20, 0, 0]);
});
