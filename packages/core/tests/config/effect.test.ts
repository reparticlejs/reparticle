import { describe, expect, it } from 'vitest';
import { $ZodError as ZodError } from 'zod/v4/core';

import { parseEffectConfig } from '#src/config/parse-effect.js';
import { effectConfigSchema } from '#src/config/schemas/definition/effect.js';

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
    input.emitters[0].modifiers.push({ type: 'unknownForce' });
    expect(issues(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['emitters', 0, 'modifiers', 4, 'type'],
          code: 'invalid_union',
        }),
      ]),
    );
    input.emitters[0].modifiers.pop();
    input.emitters[0].emission.shape.type = 'sphere';
    expect(issues(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: ['emitters', 0, 'emission', 'shape', 'type'],
          code: 'invalid_union',
        }),
      ]),
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
        }),
      ]),
    );
    input.emitters[0].initial.lifetime = 0;
    expect(issues(input)).toEqual([]);
    input.emitters[0].initial.lifetime = 2;
    input.emitters[0].initial.speeed = 1;
    expect(issues(input)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['emitters', 0, 'initial'], code: 'unrecognized_keys' }),
      ]),
    );
  });
});

describe('multiple emitters', () => {
  it('preserves independently configured emitters in definition order', () => {
    const input = example();
    const first = input.emitters[0];
    input.emitters.push({
      ...first,
      id: 'smoke',
      capacity: 256,
      startDelay: 0.5,
      playMode: 'once',
    });
    const parsed = parseEffectConfig(input);
    expect(parsed.emitters.map((emitter) => emitter.id)).toEqual([first.id, 'smoke']);
    expect(parsed.emitters[1]).toMatchObject({ capacity: 256, startDelay: 0.5, playMode: 'once' });
    parsed.emitters[1]!.initial.speed = 10;
    expect(parsed.emitters[0].initial.speed).toBe(first.initial.speed);
  });

  it('rejects empty effects and duplicate emitter IDs', () => {
    expect(() => parseEffectConfig({ version: 1, emitters: [] })).toThrow(ZodError);
    const input = example();
    input.emitters.push(input.emitters[0]);
    expect(() => parseEffectConfig(input)).toThrow(ZodError);
  });
});

it('defaults absent position to the effect origin and preserves signed offsets', () => {
  const input = example();
  delete input.emitters[0].position;
  expect(parseEffectConfig(input).emitters[0].position).toEqual({ x: 0, y: 0 });
  input.emitters[0].position = { x: -24, y: 18 };
  const parsed = parseEffectConfig(input);
  expect(parsed.emitters[0].position).toEqual({ x: -24, y: 18 });
  input.emitters[0].position.x = 10;
  expect(parsed.emitters[0].position.x).toBe(-24);
});
