import type { Example } from './types/example';

export const examples: readonly Example[] = [
  {
    id: 'fountain',
    name: 'Star fountain',
    file: 'effect.json',
    artwork: { sparks: { source: 'textures/particles.json', frame: 'star' } },
  },
  {
    id: 'multiple',
    name: 'Multi-emitter',
    file: 'multiple-emitters.json',
    artwork: { sparks: { source: 'textures/particles.json', frame: 'spark' } },
  },
  {
    id: 'dust',
    name: 'Dust',
    file: 'particle-examples/dust.json',
    artwork: { dust: { source: 'particle-examples/particle-blob.png' } },
  },
];
