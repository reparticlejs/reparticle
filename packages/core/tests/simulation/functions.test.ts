import { expect, it } from 'vitest';

import * as implementations from '#src/simulation/functions.js';
import functions from '#src/simulation/functions.json';

it('ships every GPU function as JavaScript source with its original name', () => {
  expect(Object.keys(functions).sort()).toEqual(Object.keys(implementations).sort());
  for (const [name, source] of Object.entries(functions)) {
    expect(source).toMatch(new RegExp(`^function ${name}\\(`));
  }
});

it('preserves helper references inside compiled kernels', () => {
  expect(functions.integrate).toContain('spawnBox(');
  expect(functions.integrate).toContain('spawnCircle(');
  expect(functions.spawnBox).toContain('spawnVariation(');
  expect(functions.spawnCircle).toContain('circleRadius(');
});

it('omits formatting whitespace from compiled function strings', () => {
  for (const source of Object.values(functions)) {
    expect(source).not.toMatch(/[\n\r\t]/);
  }
});
