import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function accelerationMagnitude(controls: PreviewControls): ScalarProperty {
  switch (controls.accelerationCurve) {
    case 'effect':
      return controls.effectAcceleration;
    case 'constant':
      return controls.acceleration;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.acceleration },
          { time: 1, value: controls.acceleration, tangent: controls.acceleration },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.acceleration, tangent: -controls.acceleration },
          { time: 1, value: 0, tangent: -controls.acceleration },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
