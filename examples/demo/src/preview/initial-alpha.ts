import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialAlpha(controls: PreviewControls): ScalarProperty {
  switch (controls.initialAlphaCurve) {
    case 'effect':
      return controls.effectAlpha;
    case 'constant':
      return controls.alpha;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.alpha },
          { time: 1, value: controls.alpha, tangent: controls.alpha },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.alpha, tangent: -controls.alpha },
          { time: 1, value: 0, tangent: -controls.alpha },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
