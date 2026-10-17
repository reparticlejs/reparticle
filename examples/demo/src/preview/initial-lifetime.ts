import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialLifetime(controls: PreviewControls): ScalarProperty {
  switch (controls.initialLifetimeCurve) {
    case 'effect':
      return controls.effectLifetime;
    case 'constant':
      return controls.lifetime;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.lifetime },
          { time: 1, value: controls.lifetime, tangent: controls.lifetime },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.lifetime, tangent: -controls.lifetime },
          { time: 1, value: 0, tangent: -controls.lifetime },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
