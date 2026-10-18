import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialAngularVelocity(controls: PreviewControls): ScalarProperty {
  switch (controls.initialAngularVelocityCurve) {
    case 'effect':
      return controls.effectAngularVelocity;
    case 'constant':
      return controls.angularVelocity;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.angularVelocity },
          { time: 1, value: controls.angularVelocity, tangent: controls.angularVelocity },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.angularVelocity, tangent: -controls.angularVelocity },
          { time: 1, value: 0, tangent: -controls.angularVelocity },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
