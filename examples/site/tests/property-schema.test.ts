import { describe, expect, it } from 'vitest';

import { properties } from '../src/content/properties';
import { propertySchema } from '../src/utils/property-schema';

describe('configuration schema metadata', () => {
  it('resolves every documented core field', () => {
    for (const property of properties.filter((entry) => !entry.path.startsWith('artwork.'))) {
      for (const field of property.fields ?? [property]) {
        expect(propertySchema(field.path).type).not.toBe('value');
      }
    }
  });

  it('uses validation bounds rather than lab slider limits', () => {
    expect(propertySchema('capacity')).toEqual({ type: 'integer', range: '1 to 1,000,000' });
    expect(propertySchema('startDelay')).toEqual({ type: 'number', range: '0 or more' });
  });

  it('resolves scalar curves, enums, and modifier array fields', () => {
    expect(propertySchema('initial.size').type).toBe('number | curve');
    expect(propertySchema('playMode').range).toBe('once\nloop');
    expect(propertySchema('emission.shape.type').range).toBe('point\ncircle\nbox\ncone2d');
    expect(propertySchema('modifiers.0.magnitude').type).toBe('number | curve');
  });
});
