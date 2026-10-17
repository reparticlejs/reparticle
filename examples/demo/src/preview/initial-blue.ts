import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialBlue(controls: PreviewControls): ScalarProperty {
  switch (controls.initialBlueCurve) {
    case 'effect':
      return controls.effectBlue;
    case 'constant':
      return controls.blue;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.blue },
          { time: 1, value: controls.blue, tangent: controls.blue },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.blue, tangent: -controls.blue },
          { time: 1, value: 0, tangent: -controls.blue },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
