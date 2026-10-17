import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialRed(controls: PreviewControls): ScalarProperty {
  switch (controls.initialRedCurve) {
    case 'effect':
      return controls.effectRed;
    case 'constant':
      return controls.red;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.red },
          { time: 1, value: controls.red, tangent: controls.red },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.red, tangent: -controls.red },
          { time: 1, value: 0, tangent: -controls.red },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
