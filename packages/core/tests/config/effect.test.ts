import { describe, expect, it } from 'vitest';
import { ZodError } from 'zod';

import { parseEffectConfig } from '#src/config/effect.js';
import { effectConfigSchema } from '#src/config/schema.js';

import skeleton from '../../../../docs/effect.example.json';

function issues(input: unknown) {
  return effectConfigSchema.safeParse(input).error?.issues ?? [];
}

const example = () => JSON.parse(JSON.stringify(skeleton));

describe('effect JSON boundary', () => {
  it('validates the documented skeleton and returns independent nested data', () => {
    const input = example();
    const parsed = parseEffectConfig(input);
    expect(parsed).toEqual(input);
    input.emitters[0].initial.speed = 0;
    input.emitters[0].emission.shape.type = 'sphere';
    expect(parsed.emitters[0].initial.speed).toBe(220);
    expect(parsed.emitters[0].emission.shape.type).toBe('point');
  });

  it.each([null, [], '{}', {}, { version: 2, emitters: [] }])(
    'rejects malformed roots and unsupported versions: %j',
    (input) => {
      expect(() => parseEffectConfig(input)).toThrow(ZodError);
    },
  );

  it('rejects unsupported features rather than dropping them', () => {
    const input = example();
    input.emitters[0].modifiers.vortex = {};
    expect(issues(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['emitters', 0, 'modifiers'], code: 'unrecognized_keys' }),
      ]),
    );
    delete input.emitters[0].modifiers.vortex;
    input.emitters[0].emission.shape.type = 'sphere';
    expect(issues(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['emitters', 0, 'emission', 'shape', 'type'],
          code: 'invalid_union',
        }),
      ]),
    );
    input.emitters.push(input.emitters[0]);
    expect(issues(input)).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['emitters'], code: 'too_big' })]),
    );
  });

  it.each([NaN, Infinity, -1, '3000', () => 3000])(
    'rejects invalid rates without coercion',
    (rate) => {
      const input = example();
      input.emitters[0].emission.rate = rate;
      expect(issues(input)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['emitters', 0, 'emission', 'rate'] }),
        ]),
      );
    },
  );

  it.each([
    ['capacity', 0],
    ['capacity', 1.5],
    ['capacity', 1_000_001],
    ['seed', -1],
    ['seed', 1.5],
    ['seed', 65536],
    ['id', ' '],
  ])('rejects invalid %s', (key, value) => {
    const input = example();
    input.emitters[0][key] = value;
    expect(issues(input)).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: ['emitters', 0, key] })]),
    );
  });

  it('rejects missing and misspelled nested properties', () => {
    const input = example();
    delete input.emitters[0].initial.lifetime;
    expect(issues(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['emitters', 0, 'initial', 'lifetime'],
          code: 'invalid_type',
        }),
      ]),
    );
    input.emitters[0].initial.lifetime = 0;
    expect(issues(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['emitters', 0, 'initial', 'lifetime'],
          code: 'too_small',
        }),
      ]),
    );
    input.emitters[0].initial.lifetime = 2;
    input.emitters[0].initial.speeed = 1;
    expect(issues(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['emitters', 0, 'initial'], code: 'unrecognized_keys' }),
      ]),
    );
  });
});
