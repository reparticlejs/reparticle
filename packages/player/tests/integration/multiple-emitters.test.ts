import { ParticleEffect } from '@reparticle/pixi';
import { expect, it } from 'vitest';

import effectDefinition from '../fixtures/multiple-emitters';

it('loads the composed demo with independent looping and once emitters', () => {
  const effect = new ParticleEffect(effectDefinition, { autoUpdate: false });
  const parsed = {
    emitters: [...effect.emitters.values()].map((emitter) => emitter.configuration),
  };
  expect(parsed.emitters.map(({ id }) => id)).toEqual(['smoke', 'fire', 'sparks']);
  expect(parsed.emitters[0]).toMatchObject({ startDelay: 0.3, playMode: 'loop' });
  expect(parsed.emitters[1]).toMatchObject({ startDelay: 0, playMode: 'loop' });
  expect(parsed.emitters[2]).toMatchObject({ startDelay: 0.15, playMode: 'once' });
  effect.destroy();
});
