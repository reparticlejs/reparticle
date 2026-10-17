import type { ScalarProperty } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';

export function initialSpeed(controls: PreviewControls): ScalarProperty {
  switch (controls.speedCurve) {
    case 'effect':
      return controls.effectSpeed;
    case 'constant':
      return controls.speed;
    case 'ramp-up':
      return {
        points: [
          { time: 0, value: 0, tangent: controls.speed },
          { time: 1, value: controls.speed, tangent: controls.speed },
        ],
      };
    case 'fade-out':
      return {
        points: [
          { time: 0, value: controls.speed, tangent: -controls.speed },
          { time: 1, value: 0, tangent: -controls.speed },
        ],
      };
  }
}
