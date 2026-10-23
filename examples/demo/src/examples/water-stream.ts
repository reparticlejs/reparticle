import type { Example } from '../types/example';

export const waterStream: Example = {
  id: 'water-stream',
  name: 'Water stream',
  file: 'effects/water-stream.json',
  artwork: {
    stream: { source: 'assets/droplet.svg' },
    highlights: { source: 'assets/droplet.svg' },
    spray: { source: 'assets/droplet.svg' },
  },
};
