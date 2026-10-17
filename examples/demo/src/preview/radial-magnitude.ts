import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function radialMagnitude(controls: PreviewControls): ScalarProperty {
  switch (controls.radialCurve) {
    case 'effect':
      return controls.effectRadial;
    case 'constant':
      return controls.radial;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.radial },
          { time: 1, value: controls.radial, tangent: controls.radial },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.radial, tangent: -controls.radial },
          { time: 1, value: 0, tangent: -controls.radial },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
