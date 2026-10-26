import { effectConfigSchema, emitterConfigSchema } from '@reparticle/core';
import { toJSONSchema } from 'zod/mini';

// Zod's public JSON Schema output keeps documentation tied to validation rules.
const emitter = toJSONSchema(emitterConfigSchema, { io: 'input', reused: 'inline' });
const effect = toJSONSchema(effectConfigSchema, { io: 'input', reused: 'inline' });
type Schema = Exclude<NonNullable<typeof emitter.properties>[string], boolean>;

function variants(schema: Schema): Schema[] {
  return (schema.anyOf ?? schema.oneOf ?? [schema]).flatMap((value) =>
    typeof value === 'boolean' ? [] : value === schema ? [value] : variants(value),
  );
}

function childSchemas(schema: Schema, key: string): Schema[] {
  return variants(schema).flatMap((variant) => {
    const child = /^\d+$/.test(key) ? variant.items : variant.properties?.[key];
    return child && typeof child === 'object' && !Array.isArray(child) ? [child] : [];
  });
}

function typeLabel(schema: Schema): string {
  if (schema.type === 'object' && schema.properties?.points) {
    return 'curve';
  }
  return Array.isArray(schema.type) ? schema.type.join(' | ') : (schema.type ?? 'value');
}

function rangeLabel(schema: Schema): string {
  if (schema.enum) {
    return schema.enum.map(String).join('\n');
  }
  if (schema.const !== undefined) {
    return String(schema.const);
  }
  const minimum = schema.minimum ?? schema.exclusiveMinimum;
  const maximum = schema.maximum ?? schema.exclusiveMaximum;
  if (minimum !== undefined && maximum !== undefined) {
    const lower = minimum.toLocaleString('en-US');
    const upper = maximum.toLocaleString('en-US');
    if (schema.exclusiveMinimum !== undefined || schema.exclusiveMaximum !== undefined) {
      return `${schema.exclusiveMinimum !== undefined ? 'More than' : 'At least'} ${lower} and ${schema.exclusiveMaximum !== undefined ? 'less than' : 'at most'} ${upper}`;
    }
    return `${lower} to ${upper}`;
  }
  if (minimum !== undefined) {
    return schema.exclusiveMinimum !== undefined
      ? `More than ${minimum.toLocaleString('en-US')}`
      : `${minimum.toLocaleString('en-US')} or more`;
  }
  if (maximum !== undefined) {
    return schema.exclusiveMaximum !== undefined
      ? `Less than ${maximum.toLocaleString('en-US')}`
      : `${maximum.toLocaleString('en-US')} or less`;
  }
  if (schema.type === 'array' && (schema.minItems !== undefined || schema.maxItems !== undefined)) {
    return schema.maxItems === undefined
      ? `${schema.minItems?.toLocaleString('en-US')} or more items`
      : `${(schema.minItems ?? 0).toLocaleString('en-US')} to ${schema.maxItems.toLocaleString('en-US')} items`;
  }
  return '';
}

/** Resolve field paths through shape/modifier unions and array entries. */
export function propertySchema(path: string): { type: string; range: string } {
  const parts = path.split('.');
  const root = parts[0] === 'effect' ? effect : emitter;
  if (parts[0] === 'effect') {
    parts.shift();
  }
  let schemas: Schema[] = [root];
  for (const part of parts) {
    schemas = schemas.flatMap((schema) => childSchemas(schema, part));
  }
  const options = schemas.flatMap(variants);
  if (!options.length) {
    throw new Error(`No configuration schema found for ${path}`);
  }
  return {
    type: [...new Set(options.map(typeLabel))].join(' | '),
    range: [...new Set(options.map(rangeLabel).filter(Boolean))].join('\n') || '—',
  };
}
