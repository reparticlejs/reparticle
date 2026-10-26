import { expect, it } from 'vitest';

import { INPUT_ARGUMENTS, INPUT_LENGTHS } from '#src/simulation/layout.js';
import shaders from '#src/simulation/shaders.json';

it('keeps the packed input contract aligned with the generated WebGL2 shader', () => {
  expect(Object.keys(shaders.arguments)).toEqual(INPUT_ARGUMENTS);
  let offset = 0;
  for (const [name, length] of Object.entries(INPUT_LENGTHS)) {
    const padded = Math.ceil(length / 4) * 4;
    expect(Object.entries(shaders.layout).find(([key]) => key === name)?.[1]).toEqual({
      offset,
      length,
      padded,
    });
    offset += padded;
  }
  expect(shaders.words).toBe(offset);
  expect(shaders.fragment).toContain('layout(std140) uniform SimulationInputs');
  // The default for sampler2D is lowp, independently of highp float.
  expect(shaders.fragment).toContain('precision highp sampler2D;');
});

it('reads large arrays from the uniform block rather than passing them through functions', () => {
  expect(shaders.fragment).toContain('data.modifiers[');
  expect(shaders.fragment).toContain('data.rotationCurve[');
  expect(shaders.fragment).not.toMatch(/\w+\(SimulationData\s/);
  expect(shaders.fragment).not.toContain('PackedModifiers');
});
