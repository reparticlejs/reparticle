import type { Example } from '../types/example';

export const stressExamples: readonly Example[] = [
  {
    id: 'stress-test',
    name: 'Snowstorm · 500K',
    file: 'stress-test/effect.json',
    fullWidth: true,
    fullHeight: true,
    artwork: {
      distant: { source: 'stress-test/particle.svg' },
      middle: { source: 'stress-test/particle.svg' },
      foreground: { source: 'stress-test/particle.svg' },
    },
  },
];
