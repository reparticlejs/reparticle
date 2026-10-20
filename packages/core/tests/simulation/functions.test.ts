import { expect, it } from 'vitest';

import { INTEGRATION_ARGUMENT_TYPES } from '#src/runtime/gpu/argument-types.js';
import * as implementations from '#src/simulation/functions.js';
import functions from '#src/simulation/functions.json';

it('ships every GPU function as JavaScript source with its original name', () => {
  expect(Object.keys(functions).sort()).toEqual(Object.keys(implementations).sort());
  for (const [name, source] of Object.entries(functions)) {
    expect(source).toMatch(new RegExp(`^function ${name}\\(`));
  }
});

it('preserves helper references inside compiled kernels', () => {
  expect(functions.integrate).toContain('sampleShape(');
  expect(functions.integrate).toContain('integrateMotion(');
  expect(functions.sampleShape).toContain('spawnBox(');
  expect(functions.sampleShape).toContain('spawnCircle(');
  expect(functions.spawnBox).toContain('spawnVariation(');
  expect(functions.spawnCircle).toContain('spawnVariation(');
});

it('omits formatting whitespace from compiled function strings', () => {
  for (const source of Object.values(functions)) {
    expect(source).not.toMatch(/[\n\r\t]/);
  }
});

it('preserves kernel parameters used by GPU.js argument settings', () => {
  const kernels = [
    [functions.initialize, implementations.initialize],
    [functions.integrate, implementations.integrate],
  ] as const;
  for (const [source, implementation] of kernels) {
    const parameters = (text: string) =>
      text.slice(text.indexOf('('), text.indexOf(')') + 1).replace(/\s/g, '');
    expect(parameters(source)).toBe(parameters(implementation.toString()));
  }
});

it('keeps the shared argument contract aligned with the integration kernel', () => {
  const source = functions.integrate;
  const parameters = source
    .slice(source.indexOf('(') + 1, source.indexOf(')'))
    .split(',')
    .map((parameter) => parameter.trim());
  expect(parameters).toEqual(Object.keys(INTEGRATION_ARGUMENT_TYPES));
});

it('mangles helpers and locals without reusing binding names across scopes', () => {
  expect(functions.advanceAge).not.toMatch(/\b(age|seconds)\b/);
  expect(functions.spawnCircle).not.toMatch(/\b(radiusSeedOffset|fullCircle)\b/);

  const names: string[] = [];
  for (const source of Object.values(functions)) {
    const parameters = source.slice(source.indexOf('(') + 1, source.indexOf(')')).split(',');
    names.push(...parameters.filter((name) => /^v[0-9a-z]+$/.test(name)));
    for (const match of source.matchAll(/\b(?:const|let|var) (v[0-9a-z]+)\b/g)) {
      names.push(match[1]!);
    }
  }
  expect(names.length).toBeGreaterThan(100);
  expect(new Set(names).size).toBe(names.length);
});
