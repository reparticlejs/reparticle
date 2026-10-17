import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function emissionRate(controls: PreviewControls): ScalarProperty {
  switch (controls.rateCurve) {
    case 'effect':
      return controls.effectRate;
    case 'constant':
      return controls.rate;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.rate },
          { time: 1, value: controls.rate, tangent: controls.rate },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.rate, tangent: -controls.rate },
          { time: 1, value: 0, tangent: -controls.rate },
        ],
      };
  }
}
