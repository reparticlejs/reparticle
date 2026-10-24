import { describe, expect, it } from 'vitest';

import { properties, propertyId, labProperties } from '../src/content/properties';
import { propertyExample } from '../src/utils/property-example';

describe('documented property experiments', () => {
  it('assigns a unique route to each experiment', () => {
    const paths = properties.map(propertyId);
    expect(new Set(paths).size).toBe(paths.length);
  });

  for (const property of properties) {
    it(`builds valid examples for ${propertyId(property)}`, () => {
      const values = [property.value, ...(property.choices ?? [])];
      if (property.range) {
        values.push(property.range[0], property.range[1]);
      }
      for (const value of values) {
        const example = propertyExample(property, value);
        expect(example.definition?.emitters.length).toBeGreaterThan(0);
        for (const emitter of example.definition!.emitters) {
          expect(example.artwork[emitter.id]).toBeDefined();
        }
      }
    });
  }
});

it('shows exactly four named modifier experiments', () => {
  expect(
    labProperties
      .filter((property) => property.group === 'Modifiers')
      .map((property) => property.label),
  ).toEqual(['Acceleration', 'Drag', 'Radial', 'Vortex']);
  expect(
    labProperties.some((property) =>
      ['modifiers', 'modifiers.0.type', 'effect.modifiers'].includes(property.path),
    ),
  ).toBe(false);
  const drag = labProperties.find((property) => property.label === 'Drag')!;
  expect(drag.fields?.find((field) => field.path.endsWith('.rotation'))?.visibleWhen).toBe(
    'useDirection',
  );
});

it('has one visual Curves experiment bound to particle opacity', () => {
  const curves = labProperties.filter((property) => property.group === 'Curves');
  expect(curves).toHaveLength(1);
  expect(curves[0]?.label).toBe('Curves');
  const curve = {
    points: [
      { time: 0, value: 0, tangent: 1 },
      { time: 0.5, value: 1, tangent: 0 },
      { time: 1, value: 0, tangent: -1 },
    ],
  };
  expect(propertyExample(curves[0], curve).definition?.emitters[0]?.overLifetime?.alpha).toEqual(
    curve,
  );
  expect(() =>
    propertyExample(curves[0], {
      points: [
        { time: 0.5, value: 1 },
        { time: 0.2, value: 0 },
      ],
    }),
  ).toThrow('Curve points must have strictly increasing times');
});

for (const property of labProperties) {
  for (const field of property.fields ?? [property]) {
    if (!field.curve) {
      continue;
    }
    it(`accepts a visual curve for ${propertyId(property)} / ${field.path}`, () => {
      const curve = {
        points: [
          { time: 0, value: 1, tangent: 0 },
          { time: 1, value: 2, tangent: 0 },
        ],
      };
      const value = property.fields
        ? { ...Object(property.value), [field.path.split('.').at(-1)!]: curve }
        : curve;
      expect(propertyExample(property, value).definition).toBeDefined();
    });
  }
}

it('keeps unsupported fields numeric', () => {
  const fields = labProperties.flatMap((property) => property.fields ?? [property]);
  const numeric = fields.filter(
    (field) =>
      field.path.endsWith('Spread') ||
      ['initial.spread', 'initial.direction', 'rotation', 'scale'].includes(field.path),
  );
  expect(numeric.every((field) => field.curve === undefined)).toBe(true);
});
