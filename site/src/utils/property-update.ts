import { parseEffectConfig, type ScalarProperty } from '@reparticle/core';
import type { Example } from '@reparticle/player/types';
import type { ExampleUpdate } from '@reparticle/player/types';

/**
 * Match the public runtime patch contract, not the broader authoring schema.
 * Undefined means reconstruction is required. Numeric birth settings affect future
 * births; renderer settings and forces can affect particles already alive.
 */
export function propertyUpdate(
  path: string,
  previous: Example,
  next: Example,
): ExampleUpdate | undefined {
  if (!next.definition) {
    return undefined;
  }
  const emitter = parseEffectConfig(next.definition).emitters[0];
  const change = { emitterId: emitter.id };
  if (path.startsWith('artwork.')) {
    return { ...change, artwork: true };
  }
  if (path === 'rendering' || path.startsWith('rendering.')) {
    return { ...change, rendering: emitter.rendering };
  }
  if (path === 'position' || path === 'position.x' || path === 'position.y') {
    return { ...change, parameters: { position: emitter.position } };
  }
  if (path === 'transform') {
    return {
      ...change,
      parameters: { position: emitter.position, rotation: emitter.rotation, scale: emitter.scale },
    };
  }
  switch (path) {
    case 'rotation':
      return { ...change, parameters: { rotation: emitter.rotation } };
    case 'scale':
      return { ...change, parameters: { scale: emitter.scale } };
    case 'inheritVelocity':
      return { ...change, parameters: { inheritVelocity: emitter.inheritVelocity } };
    case 'stretchWithVelocity':
      return { ...change, parameters: { stretchWithVelocity: emitter.stretchWithVelocity } };
    case 'emission.rate':
      if (
        emitter.emission.rateSpread !==
        parseEffectConfig(previous.definition).emitters[0].emission.rateSpread
      ) {
        return undefined;
      }
      return typeof emitter.emission.rate === 'number'
        ? { ...change, parameters: { emission: { rate: emitter.emission.rate } } }
        : undefined;
  }
  if (path.startsWith('initial.')) {
    const field = path.slice('initial.'.length);
    const initial: Record<string, ScalarProperty> = emitter.initial;
    const groups: Record<string, string[]> = {
      color: ['red', 'green', 'blue'],
      stretch: ['stretchX', 'stretchY'],
      direction: ['direction', 'spread'],
    };
    // Birth values and their spreads are edited together in the lab.
    const fields = (groups[field] ?? [field]).flatMap((key) =>
      `${key}Spread` in initial ? [key, `${key}Spread`] : [key],
    );
    const entries = fields.map((key) => [key, initial[key]] as const);
    if (entries.some(([, value]) => typeof value !== 'number')) {
      return undefined;
    }
    return { ...change, parameters: { initial: Object.fromEntries(entries) } };
  }
  if (path === 'modifiers' || path.startsWith('modifiers.')) {
    return { ...change, parameters: { modifiers: emitter.modifiers } };
  }
  if (path === 'emission.shape' || path.startsWith('emission.shape.')) {
    const oldShape = previous.definition?.emitters[0]?.emission.shape;
    const { type, ...dimensions } = emitter.emission.shape;
    if (oldShape?.type !== type) {
      return undefined;
    }
    const shape: Record<string, number> = {};
    for (const [field, value] of Object.entries(dimensions)) {
      // A patch cannot replace a dimension curve. Leave unchanged curves alone
      // when editing a different dimension or its spread.
      if (
        path !== 'emission.shape' &&
        path !== 'emission.shape.dimensions' &&
        path !== 'emission.shape.dimensionSpread' &&
        path !== `emission.shape.${field}` &&
        !(path === 'emission.shape.diameter' && field === 'diameterSpread')
      ) {
        continue;
      }
      if (typeof value !== 'number') {
        return undefined;
      }
      shape[field] = value;
    }
    return { ...change, parameters: { emission: { shape } } };
  }
  return undefined;
}

export function propertyUpdateNote(path: string, live: boolean): string {
  if (!live) {
    return 'This setting requires rebuilding the effect. Editing it restarts the preview.';
  }
  if (path.startsWith('initial.') || path.startsWith('emission.')) {
    return 'Updates live for new births. Existing particles keep their birth settings.';
  }
  return 'Updates live without clearing particles or resetting playback.';
}
