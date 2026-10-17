import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialRotation(controls: PreviewControls): ScalarProperty {
  switch (controls.initialRotationCurve) {
    case 'effect':
      return controls.effectRotation;
    case 'constant':
      return controls.rotation;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.rotation },
          { time: 1, value: controls.rotation, tangent: controls.rotation },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.rotation, tangent: -controls.rotation },
          { time: 1, value: 0, tangent: -controls.rotation },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
