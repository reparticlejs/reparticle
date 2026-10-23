import type { Example } from '../types/example';

export const firePlumeAnim: Example = {
  id: 'fire-plume-anim',
  name: 'Fire Plume',
  file: 'effects/fire-plume-anim.json',
  artwork: {
    'fire-plume-anim': {
      source: 'assets/fire_01_8x8.json',
      animation: 'play',
      playback: 'once-forward',
    },
  },
};
