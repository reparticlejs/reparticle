import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialGreen(controls: PreviewControls): ScalarProperty {
  switch (controls.initialGreenCurve) {
    case 'effect':
      return controls.effectGreen;
    case 'constant':
      return controls.green;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.green },
          { time: 1, value: controls.green, tangent: controls.green },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.green, tangent: -controls.green },
          { time: 1, value: 0, tangent: -controls.green },
        ],
      };
  }
}
