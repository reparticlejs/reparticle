import type { Example } from '../../types/example';

export const example: Example = {
  id: 'fire-plume-anim',
  name: 'Fire Plume',
  file: 'effects/fire-plume-anim.json',
  artwork: {
    'fire-plume-anim': {
      source: 'assets/fire-plume.json',
      animation: 'play',
      playback: 'once-forward',
    },
  },
};
