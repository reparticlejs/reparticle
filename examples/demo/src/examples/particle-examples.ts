import type { Example } from '../types/example';

export const particleExamples: readonly Example[] = [
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
    id: 'smoke',
    name: 'Smoke',
    file: 'particle-examples/smoke.json',
    artwork: { smoke: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'fog',
    name: 'Fog',
    file: 'particle-examples/fog.json',
    artwork: { fog: { source: 'particle-examples/particle-blob.png' } },
  },
  {
    id: 'confetti',
    name: 'Confetti',
    file: 'particle-examples/confetti.json',
    verticalPosition: 0,
    fullWidth: true,
    artwork: { emitter: { source: 'particle-examples/ta.png' } },
  },
];
