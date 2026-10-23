import type { Example } from '../types/example';

export const debrisExplosion: Example = {
  id: 'debris-explosion',
  name: 'Debris explosion',
  file: 'effects/debris-explosion.json',
  artwork: {
    dust: { source: 'assets/smoke_01_a.png' },
    flash: { source: 'assets/particle-blob.png' },
    chunks: { source: 'assets/fragment.svg' },
    chips: { source: 'assets/fragment.svg' },
  },
};
