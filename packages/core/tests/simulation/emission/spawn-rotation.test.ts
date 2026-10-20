import { expect, it } from 'vitest';

import { spawnBox } from '#src/simulation/emission/box.js';
import { spawnCircle } from '#src/simulation/emission/circle.js';
import { spawnCone2D } from '#src/simulation/emission/cone2d.js';
import { spawnRotation } from '#src/simulation/emission/rotation.js';

it('aligns local up to the point direction', () => {
  for (const [direction, rotation] of [
    [-Math.PI / 2, 0],
    [0, -90],
    [Math.PI / 2, -180],
    [Math.PI, 90],
  ]) {
    expect(spawnRotation(Math.cos(direction!), Math.sin(direction!))).toBeCloseTo(rotation!);
  }
});

it('keeps box and degenerate cone orientation upward', () => {
  const box = spawnBox(0, 1, 0, 0, 1, 100, 200);
  const cone = spawnCone2D(0, 1, 0, 0, 1, 0, 0);
  expect(spawnRotation(box[2], box[3])).toBeCloseTo(0);
  expect(spawnRotation(cone[2], cone[3])).toBeCloseTo(0);
});

it('rotates local up onto sampled directions, including a zero-diameter circle', () => {
  for (let id = 0; id < 20; id++) {
    const samples = [
      spawnCircle(id, 17, 0, 0, 1, 0),
      spawnCircle(id, 17, 0, 0, 1, 100),
      spawnCone2D(id, 17, 0, 0, 1, 200, 100),
    ];
    for (const sample of samples) {
      const angle = (-spawnRotation(sample[2], sample[3]) * Math.PI) / 180;
      expect(Math.sin(angle)).toBeCloseTo(sample[2]);
      expect(-Math.cos(angle)).toBeCloseTo(sample[3]);
    }
  }
});
