import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function vortexMagnitude(controls: PreviewControls): ScalarProperty {
  switch (controls.vortexCurve) {
    case 'effect':
      return controls.effectVortex;
    case 'constant':
      return controls.vortex;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.vortex },
          { time: 1, value: controls.vortex, tangent: controls.vortex },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.vortex, tangent: -controls.vortex },
          { time: 1, value: 0, tangent: -controls.vortex },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
