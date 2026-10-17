import { parseEffectConfig } from '@reparticle/core';
import { expect, it } from 'vitest';

import { applyControls, emitterParameters, initialControls } from '#src/preview/apply-controls.js';

import effect from '../../public/effect.json';

it.each(['circle', 'box', 'cone2d'])(
  'preserves authored %s curves and spreads through unrelated control updates',
  (type) => {
    const curve = {
      points: [
        { time: 0, value: 20 },
        { time: 1, value: 200 },
      ],
    };
    const shape =
      type === 'circle'
        ? { type, diameter: curve, diameterSpread: 25 }
        : { type, width: curve, height: curve, widthSpread: 25, heightSpread: 10 };
    const source = effect.emitters[0]!;
    const definition = parseEffectConfig({
      version: 1,
      emitters: [{ ...source, emission: { ...source.emission, shape } }],
    }).emitters[0];
    const controls = initialControls(definition);
    expect(applyControls(definition, controls).emission.shape).toEqual(definition.emission.shape);
    expect(emitterParameters(controls).emission?.shape).toEqual(
      type === 'circle' ? { diameterSpread: 25 } : { widthSpread: 25, heightSpread: 10 },
    );
    const changed = applyControls(definition, {
      ...controls,
      diameterCurve: 'ramp-up',
      widthCurve: 'ramp-up',
      heightCurve: 'fade-out',
    });
    expect(changed.emission.shape).not.toEqual(definition.emission.shape);
  },
);
