import type { ModifierConfig } from '@reparticle/core';

import type { PreviewControls } from '../types/preview';
import { accelerationMagnitude } from './acceleration-magnitude';
import { dragMagnitude } from './drag-magnitude';
import { radialMagnitude } from './radial-magnitude';
import { vortexMagnitude } from './vortex-magnitude';

/** The demo edits the first modifier of each type, preserving other entries and their order. */
export function controlledModifiers(
  current: ModifierConfig[],
  controls: PreviewControls,
): ModifierConfig[] {
  const replacements: ModifierConfig[] = [
    {
      type: 'acceleration',
      magnitude: accelerationMagnitude(controls),
      spread: controls.accelerationSpread,
      rotation: controls.accelerationRotation,
    },
    {
      type: 'drag',
      magnitude: dragMagnitude(controls),
      spread: controls.dragSpread,
      useDirection: controls.dragDirectional,
      rotation: controls.dragRotation,
    },
    {
      type: 'radial',
      magnitude: radialMagnitude(controls),
      spread: controls.radialSpread,
      x: controls.radialX,
      y: controls.radialY,
      maxDistance: controls.radialMaxDistance,
    },
    {
      type: 'vortex',
      magnitude: vortexMagnitude(controls),
      spread: controls.vortexSpread,
      x: controls.vortexX,
      y: controls.vortexY,
      maxDistance: controls.vortexMaxDistance,
      rotation: controls.vortexRotation,
    },
  ];
  const result = [...current];
  for (const replacement of replacements) {
    const index = result.findIndex(({ type }) => type === replacement.type);
    if (index === -1) {
      result.push(replacement);
    } else {
      result[index] = replacement;
    }
  }
  return result;
}
