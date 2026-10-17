import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function emitterWidth(controls: PreviewControls): ScalarProperty {
  switch (controls.widthCurve) {
    case 'effect':
      return controls.effectWidth;
    case 'constant':
      return controls.width;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.width },
          { time: 1, value: controls.width, tangent: controls.width },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.width, tangent: -controls.width },
          { time: 1, value: 0, tangent: -controls.width },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
