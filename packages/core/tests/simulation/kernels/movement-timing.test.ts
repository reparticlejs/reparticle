import { expect, it } from 'vitest';

import { integrate } from '#src/simulation/kernels/integrate.js';
import type { ParticleTexture } from '#types/layout.js';

function simulation({
  speed = 10,
  direction = -Math.PI / 2,
  modifiers = new Float32Array([1, 0, 0, 1000, 0, 0, 0, 1, 0, 0, 0]),
  inheritedX = 0,
  inheritedY = 0,
  handedness = 1,
  cosine = 1,
  sine = 0,
  lifetime = 10,
  initialRotation = 0,
  movement = 1,
} = {}) {
  let state: ParticleTexture = Array.from({ length: 5 }, () => [[0, 0, 0, 0]]);
  return (seconds: number, spawn = false) => {
    const next: ParticleTexture = Array.from({ length: 5 }, (_, row) => [
      integrate.call(
        { thread: { x: 0, y: row }, constants: { width: 1, rows: 1, capacity: 1 } },
        state,
        seconds,
        new Float32Array([spawn ? 1 : 0]),
        spawn ? 1 : 0,
        0,
        0, // Emitter position.
        speed,
        direction,
        0,
        lifetime,
        1, // Lifetime and seed.
        0,
        0,
        0, // Point shape and dimensions.
        24,
        1,
        1,
        1,
        1, // Size and color.
        initialRotation,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0, // Initial property spreads.
        0,
        0, // Shape spreads.
        inheritedX,
        inheritedY,
        cosine,
        sine,
        1,
        new Float32Array(65),
        movement,
        0,
        0,
        new Float32Array(65).fill(1),
        0, // Angular velocity.
        0.25,
        0.5,
        0,
        0, // Stretch and spreads.
        modifiers,
        handedness,
      ),
    ]);
    state = next;
    return { motion: next[0]![0]!, geometry: next[4]![0]!, active: next[3]![0]![0] };
  };
}

it('captures birth velocity before forces and uses the incoming velocity on the next step', () => {
  const step = simulation();
  const born = step(0.1, true);
  expect(born.motion[2]).toBeCloseTo(100);
  expect(born.motion[3]).toBeCloseTo(-10);
  expect(born.geometry[3]).toBeCloseTo(0);
  const next = step(0.1);
  expect(next.motion[2]).toBeCloseTo(200);
  expect(next.geometry[3]).toBeCloseTo((-Math.atan2(100, 10) * 180) / Math.PI);
  expect(next.geometry.slice(0, 3)).toEqual([0.25, 0.5, 1]);
});

it('keeps the entering heading on the step drag stops a particle, then returns to base orientation', () => {
  const step = simulation({
    direction: 0,
    modifiers: new Float32Array([1, 0, 1, 10, 0, 0, 0, 1, 0, 0, 0]),
  });
  const stopped = step(0.1, true);
  expect(stopped.motion.slice(2)).toEqual([0, 0]);
  expect(stopped.geometry[3]).toBeCloseTo(-90);
  expect(step(0).geometry[3]).toBeCloseTo(-90);
  expect(step(0.1).geometry[3]).toBe(0);
});

it('does not reverse artwork until the step after acceleration reverses velocity', () => {
  const step = simulation({
    direction: 0,
    modifiers: new Float32Array([1, 0, 0, 200, 0, 0, 0, -1, 0, 0, 0]),
  });
  const reversed = step(0.1, true);
  expect(reversed.motion[2]).toBeCloseTo(-10);
  expect(reversed.geometry[3]).toBeCloseTo(-90);
  expect(step(0.1).geometry[3]).toBeCloseTo(90);
});

it('captures transformed spawn velocity plus inherited velocity without including initial artwork rotation', () => {
  const step = simulation({
    direction: 0,
    handedness: -1,
    cosine: 0,
    sine: -1,
    inheritedX: 10,
    inheritedY: -20,
    initialRotation: 45,
  });
  const born = step(0.1, true);
  expect(born.geometry[2]).toBe(-1);
  expect(born.geometry[3]).toBeCloseTo(-45);
});

it('keeps radial-center direction consistent with the rendered pre-force heading', () => {
  const step = simulation({
    speed: 0,
    initialRotation: 45,
    modifiers: new Float32Array([1, 1, 2, 100, 0, 0, 0, 0, -1, 100, 0]),
  });
  const born = step(0.1, true);
  expect(born.geometry[3]).toBe(0);
  expect(born.motion[2]).toBeCloseTo(-Math.SQRT1_2 * 10);
  expect(born.motion[3]).toBeCloseTo(-Math.SQRT1_2 * 10);
  expect(step(0.1).geometry[3]).toBeCloseTo(45);
});

it('does not update expired geometry and overwrites the heading on slot reuse', () => {
  const step = simulation({ direction: 0, lifetime: 0.1 });
  const born = step(0.1, true);
  expect(step(0).geometry).toEqual(born.geometry);
  const expired = step(0.1);
  expect(expired.active).toBe(0);
  expect(expired.geometry).toEqual(born.geometry);
  expect(step(0.1, true).geometry).toEqual(born.geometry);
});

it('does not add movement rotation to other orientation modes', () => {
  const step = simulation({ direction: 0, movement: 0 });
  expect(step(0.1, true).geometry[3]).toBe(0);
  expect(step(0.1).geometry[3]).toBe(0);
});
