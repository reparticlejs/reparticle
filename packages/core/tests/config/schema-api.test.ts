import { expect, it } from 'vitest';
import { optional, toJSONSchema } from 'zod/mini';
import { $ZodError } from 'zod/v4/core';

import { effectConfigSchema, emitterConfigSchema, renderingSchema } from '#src/index.js';

it.each([effectConfigSchema, emitterConfigSchema, renderingSchema])(
  'keeps English messages on public schemas',
  (schema) => {
    const result = schema.safeParse(null);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      {
        expected: 'object',
        code: 'invalid_type',
        path: [],
        message: 'Invalid input: expected object, received null',
      },
    ]);
    expect(() => schema.parse(null)).toThrow(Error);
    expect(() => schema.parse(null)).toThrow($ZodError);
  },
);

it('supports Mini composition and standalone JSON Schema generation', () => {
  expect(optional(effectConfigSchema).parse(undefined)).toBeUndefined();
  const schema = toJSONSchema(effectConfigSchema, { io: 'input' });
  expect(schema.type).toBe('object');
  expect(schema.additionalProperties).toBe(false);
  expect(schema.required).toEqual(['version', 'emitters']);
});

it('creates independent default objects on each parse', () => {
  const first = renderingSchema.parse(undefined);
  const second = renderingSchema.parse(undefined);
  first.blendMode = 'add';
  expect(second).toEqual({ blendMode: 'normal' });
});
