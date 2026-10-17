import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function emitterDiameter(controls: PreviewControls): ScalarProperty {
  switch (controls.diameterCurve) {
    case 'effect':
      return controls.effectDiameter;
    case 'constant':
      return controls.diameter;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.diameter },
          { time: 1, value: controls.diameter, tangent: controls.diameter },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.diameter, tangent: -controls.diameter },
          { time: 1, value: 0, tangent: -controls.diameter },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
