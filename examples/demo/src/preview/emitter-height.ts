import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function emitterHeight(controls: PreviewControls): ScalarProperty {
  switch (controls.heightCurve) {
    case 'effect':
      return controls.effectHeight;
    case 'constant':
      return controls.height;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.height },
          { time: 1, value: controls.height, tangent: controls.height },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.height, tangent: -controls.height },
          { time: 1, value: 0, tangent: -controls.height },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
