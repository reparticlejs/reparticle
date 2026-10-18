import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialStretch(controls: PreviewControls, axis: 'X' | 'Y'): ScalarProperty {
  const value = controls[`stretch${axis}`];
  switch (controls[`initialStretch${axis}Curve`]) {
    case 'effect':
      return controls[`effectStretch${axis}`];
    case 'constant':
      return value;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: value },
          { time: 1, value, tangent: value },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value, tangent: -value },
          { time: 1, value: 0, tangent: -value },
        ],
      };
  }
  throw new Error('Unsupported emitter curve mode');
}
