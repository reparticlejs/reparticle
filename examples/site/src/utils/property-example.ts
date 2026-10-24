import { parseEffectConfig } from '@reparticle/core';
import type { Example } from '@reparticle/demo/types/example';

import type { Property } from '../types/property';

/** Build an isolated experiment, then let the public schema validate every edit. */
export function propertyExample(property: Property, value: unknown): Example {
  const emitter: Record<string, unknown> = {
    id: 'experiment',
    capacity: 2048,
    seed: 42,
    emission: { rate: 120, shape: { type: 'point' } },
    initial: {
      lifetime: 2,
      speed: 90,
      direction: -Math.PI / 2,
      spread: Math.PI / 2,
      size: 12,
      red: 0.6,
      green: 0.9,
      blue: 1,
    },
  };
  for (const [path, setting] of Object.entries(property.setup ?? {})) {
    setPath(emitter, path, setting);
  }
  const definition: Record<string, unknown> = { version: 1, emitters: [emitter] };
  if (property.fields) {
    if (!isObject(value)) {
      throw new Error('Enter an object containing the grouped fields.');
    }
    const keys = property.fields.map((field) => field.path.split('.').at(-1)!);
    if (
      Object.keys(value).some((key) => !keys.includes(key)) ||
      keys.some((key) => !(key in value))
    ) {
      throw new Error(`Provide exactly these fields: ${keys.join(', ')}.`);
    }
    for (const field of property.fields) {
      if (!field.path.startsWith('artwork.')) {
        setPath(emitter, field.path, value[field.path.split('.').at(-1)!]);
      }
    }
  } else if (property.path.startsWith('effect.')) {
    setPath(definition, property.path.slice(7), value);
  } else if (property.path === 'emission.shape.type') {
    const shape =
      value === 'circle'
        ? { type: value, diameter: 120 }
        : value === 'box' || value === 'cone2d'
          ? { type: value, width: 120, height: 120 }
          : { type: value };
    setPath(emitter, 'emission.shape', shape);
  } else if (!property.path.startsWith('artwork.')) {
    setPath(emitter, property.path, value);
  }
  const config = parseEffectConfig(definition);
  const asset =
    property.group === 'Artwork'
      ? {
          source: 'assets/coins.json',
          animation: 'coin_gold',
          playback: 'loop-forward' as const,
          fps: 12,
          sizeMode: 'manual' as const,
          pivot: { x: 0, y: 0 },
          flipX: false,
          flipY: false,
          animationSize: { width: 64, height: 64 },
        }
      : { source: 'assets/confetti-strip.png' };
  if (property.path.startsWith('artwork.')) {
    if (property.fields && isObject(value)) {
      for (const field of property.fields) {
        setPath(asset, field.path.slice(8), value[field.path.split('.').at(-1)!]);
      }
    } else {
      setPath(asset, property.path.slice(8), value);
    }
  }
  return {
    id: property.path,
    name: property.path,
    file: '',
    definition: config,
    ...(['space', 'inheritVelocity'].includes(property.path)
      ? { motion: 'figure-eight' as const }
      : {}),
    artwork: Object.fromEntries(config.emitters.map(({ id }) => [id, asset])),
  };
}

/** Paths belong to the authored catalog, never to user-entered JSON. */
function setPath(target: Record<string, unknown>, path: string, value: unknown) {
  const keys = path.split('.');
  let parent = target;
  for (const key of keys.slice(0, -1)) {
    const child = parent[key];
    if (isObject(child)) {
      parent = child;
    } else {
      const next: Record<string, unknown> = {};
      parent[key] = next;
      parent = next;
    }
  }
  parent[keys[keys.length - 1]] = structuredClone(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
