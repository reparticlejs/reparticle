import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialSize(controls: PreviewControls): ScalarProperty {
  switch (controls.initialSizeCurve) {
    case 'effect':
      return controls.effectSize;
    case 'constant':
      return controls.size;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.size },
          { time: 1, value: controls.size, tangent: controls.size },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.size, tangent: -controls.size },
          { time: 1, value: 0, tangent: -controls.size },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
