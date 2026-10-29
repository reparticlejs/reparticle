import type { Example } from '@reparticle/player/types';

// Only metadata is bundled here; effect JSON and textures load when selected.
const definitions = import.meta.glob<Example>('./effects/*.ts', {
  eager: true,
  import: 'example',
});

/** Dropdown order; the first entry is selected on startup. */
const order = [
  'energy',
  'explosion',
  'celebration-cracker',
  'candle-flame',
  'loading',
  'smoke',
  'fog',
  'confetti',
  'confetti-rain',
  'ember-rise',
  'ease-pop',
  'star-sparkle',
  'rain',
  'stardust-fall',
  'nebula',
  'hyperspace',
  'bubbles',
  'coin-shower',
  'coin-fountain',
  'black-hole',
  'cyclone',
  'spinning-coins',
  'soft-smoke',
  'steam-plume',
  'fire-plume',
  'wispy-smoke',
  'coin-spark-trail',
  'infinity-loop',
  'water-stream',
  'falling-leaves',
  'fireball',
  'fireworks',
  'portal',
  'tornado',
  'flies',
  'campfire',
  'metal-sparks',
  'magic-impact',
  'magical-aura',
  'debris-explosion',
  'snowstorm',
];

export const examples: readonly Example[] = order.map((name) => {
  const example = definitions[`./effects/${name}.ts`];
  if (!example) {
    throw new Error(`Missing example definition: ${name}`);
  }
  return example;
});
