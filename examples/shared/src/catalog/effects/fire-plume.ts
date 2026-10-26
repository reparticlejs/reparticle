import type { Example } from '@reparticle/player/types';

export const example: Example = {
  id: 'fire-plume',
  name: 'Fire Plume',
  file: 'effects/fire-plume.json',
  artwork: {
    'fire-plume': {
      source: 'assets/fire-plume.json',
      animation: 'play',
      playback: 'once-forward',
    },
  },
};
