import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function dragMagnitude(controls: PreviewControls): ScalarProperty {
  switch (controls.dragCurve) {
    case 'effect':
      return controls.effectDrag;
    case 'constant':
      return controls.drag;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.drag },
          { time: 1, value: controls.drag, tangent: controls.drag },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.drag, tangent: -controls.drag },
          { time: 1, value: 0, tangent: -controls.drag },
        ],
      };
  }

  throw new Error('Unsupported emitter curve mode');
}
