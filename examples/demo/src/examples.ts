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
  {
    id: 'energy',
    name: 'Energy',
    file: 'particle-examples/energy.json',
    artwork: { energy: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'exp1',
    name: 'Explosion',
    file: 'particle-examples/exp1.json',
    artwork: {
      emitter2: { source: 'particle-examples/circle-05.png' },
      d: { source: 'particle-examples/circle-05.png' },
      emitter: { source: 'particle-examples/circle-05.png' },
      emitter3: { source: 'particle-examples/scorch-01.png' },
    },
  },
  {
    id: 'exp2',
    name: 'Celebration cracker',
    file: 'particle-examples/exp2.json',
    artwork: { emitter4: { source: 'particle-examples/ta.png' } },
  },
  {
    id: 'fire',
    name: 'Candle flame',
    file: 'particle-examples/fire.json',
    artwork: { fire: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'loading',
    name: 'Loading',
    file: 'particle-examples/loading.json',
    artwork: { loading: { source: 'particle-examples/circle-05-up.png' } },
  },
  {
    id: 'slash',
    name: 'Slash',
    file: 'particle-examples/slash.json',
    artwork: { slash: { source: 'particle-examples/particle-blob.png' } },
  },
];
