import { Player } from '@reparticle/player';
import type { Example } from '@reparticle/player/types';
import { useSyncExternalStore } from 'react';

const motionQuery = '(prefers-reduced-motion: reduce)';

function subscribeMotion(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const particles: Example = {
  id: 'hero-particles',
  name: 'Hero particles',
  file: '',
  fullWidth: true,
  fullHeight: true,
  artwork: { particles: { source: 'assets/soft-particle.png' } },
  definition: {
    version: 1,
    emitters: [
      {
        id: 'particles',
        seed: 73,
        capacity: 128,
        startOffset: 20,
        emission: { rate: 4, shape: { type: 'box', width: 1000, height: 700 } },
        initial: {
          lifetime: 20,
          lifetimeSpread: 4,
          speed: 10,
          speedSpread: 5,
          direction: 0,
          spread: 0,
          size: 10,
          sizeSpread: 5,
          red: 0.45,
          green: 0.67,
          blue: 0.25,
          alpha: 0.65,
        },
        overLifetime: {
          alpha: {
            points: [
              { time: 0, value: 0, tangent: 0 },
              { time: 0.25, value: 1, tangent: 0 },
              { time: 0.7, value: 0.8, tangent: 0 },
              { time: 1, value: 0, tangent: 0 },
            ],
          },
          scale: {
            points: [
              { time: 0, value: 0.6, tangent: 0 },
              { time: 1, value: 1.2, tangent: 0 },
            ],
          },
        },
        rendering: { blendMode: 'normal' },
      },
    ],
  },
};

/** Mount no GPU player for reduced motion; preference changes also release it. */
export default function HeroParticles() {
  const reducedMotion = useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia(motionQuery).matches,
    () => true,
  );
  return reducedMotion ? null : (
    <div className="hero-particles" aria-hidden="true">
      <Player initialExample={particles} immersive />
    </div>
  );
}
