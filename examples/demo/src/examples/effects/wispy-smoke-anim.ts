import type { Example } from '../../types/example';

export const example: Example = {
  id: 'wispy-smoke-anim',
  name: 'Wispy Smoke',
  file: 'effects/wispy-smoke-anim.json',
  artwork: {
    'wispy-smoke-anim': {
      source: 'assets/wispy-smoke.json',
      animation: 'play',
      playback: 'once-forward',
    },
  },
};
