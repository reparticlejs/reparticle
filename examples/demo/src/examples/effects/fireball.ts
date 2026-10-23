import type { Example } from '../../types/example';

export const example: Example = {
  id: 'fireball',
  name: 'Fireball',
  file: 'effects/fireball.json',
  motion: 'pendulum',
  artwork: {
    smoke: { source: 'assets/smoke-cloud.png' },
    flame: { source: 'assets/soft-particle.png' },
    core: { source: 'assets/soft-particle.png' },
    sparks: { source: 'assets/soft-particle.png' },
  },
};
