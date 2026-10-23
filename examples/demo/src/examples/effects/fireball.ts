import type { Example } from '../../types/example';

export const example: Example = {
  id: 'fireball',
  name: 'Fireball',
  file: 'effects/fireball.json',
  motion: 'pendulum',
  artwork: {
    smoke: { source: 'assets/smoke_01_a.png' },
    flame: { source: 'assets/particle-blob.png' },
    core: { source: 'assets/particle-blob.png' },
    sparks: { source: 'assets/particle-blob.png' },
  },
};
