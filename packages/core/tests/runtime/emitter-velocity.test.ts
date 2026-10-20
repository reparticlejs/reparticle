import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { updateEmitterConfig } from '#src/config/update-emitter.js';
import { EmitterVelocity } from '#src/runtime/emitter-velocity.js';

import skeleton from '../../../../docs/effect.example.json';

it('estimates motion after the first sample and stops inheriting when stationary', () => {
  const motion = new EmitterVelocity();
  motion.update(100, 200, 0.1);
  expect([motion.x, motion.y]).toEqual([0, 0]);
  motion.update(110, 180, 0.1);
  expect([motion.x, motion.y]).toEqual([100, -200]);
  motion.update(110, 180, 0.05);
  expect([motion.x, motion.y]).toEqual([0, 0]);
  motion.reset();
  motion.update(1000, 1000, 0.1);
  expect([motion.x, motion.y]).toEqual([0, 0]);
});

it('records position on zero-time updates without dividing or changing velocity', () => {
  const motion = new EmitterVelocity();
  motion.update(0, 0, 0);
  motion.update(10, 20, 0.1);
  motion.update(100, 200, 0);
  expect([motion.x, motion.y]).toEqual([100, 200]);
  motion.update(110, 210, 0.1);
  expect([motion.x, motion.y]).toEqual([100, 100]);
});

it('defaults inheritance to zero and accepts finite runtime factors', () => {
  const source = { ...skeleton.emitters[0]!, inheritVelocity: undefined };
  const config = parseEffectConfig({ version: 1, emitters: [source] }).emitters[0];
  expect(config.inheritVelocity).toBe(0);
  for (const inheritVelocity of [-1, 0, 0.5, 1, 2]) {
    expect(updateEmitterConfig(config, { inheritVelocity }).inheritVelocity).toBe(inheritVelocity);
  }
  for (const inheritVelocity of [NaN, Infinity, '1', null]) {
    expect(() => updateEmitterConfig(config, { inheritVelocity })).toThrow(ZodError);
  }
});
