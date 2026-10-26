import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { parseEffectConfig } from '@reparticle/core';
import { expect, it } from 'vitest';

import { examples } from '../src/catalog';

it('keeps catalog IDs unique', () => {
  expect(new Set(examples.map((example) => example.id)).size).toBe(examples.length);
});

it.each(examples)('resolves the definition and artwork for $id', (example) => {
  const root = new URL('../public/', import.meta.url);
  const definition = parseEffectConfig(
    JSON.parse(readFileSync(new URL(example.file, root), 'utf8')),
  );
  const ids = definition.emitters.map((emitter) => emitter.id);
  for (const [id, artwork] of Object.entries(example.artwork)) {
    expect(ids).toContain(id);
    expect(existsSync(fileURLToPath(new URL(artwork.source, root)))).toBe(true);
  }
});
