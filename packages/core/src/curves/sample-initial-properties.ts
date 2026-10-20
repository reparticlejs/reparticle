import type { EmitterConfig, EmitterParameters } from '#types/effect.js';
import type { InitialPropertyCurves } from '#types/initial-property-curves.js';

import { SampledCurve } from './sampled-curve';

/**
 * Prepare initial-property curves before committing an emitter configuration.
 * For runtime patches, reuse every curve whose property was not supplied.
 * If sampling throws, the previous set remains unchanged.
 */
export function sampleInitialProperties(
  initial: EmitterConfig['initial'],
  previous?: InitialPropertyCurves,
  patch?: EmitterParameters['initial'],
): InitialPropertyCurves {
  function sample(property: keyof InitialPropertyCurves): SampledCurve {
    if (previous && patch?.[property] === undefined) {
      return previous[property];
    }
    return new SampledCurve(initial[property]);
  }

  return {
    lifetime: sample('lifetime'),
    speed: sample('speed'),
    size: sample('size'),
    rotation: sample('rotation'),
    angularVelocity: sample('angularVelocity'),
    stretchX: sample('stretchX'),
    stretchY: sample('stretchY'),
    red: sample('red'),
    green: sample('green'),
    blue: sample('blue'),
    alpha: sample('alpha'),
  };
}
