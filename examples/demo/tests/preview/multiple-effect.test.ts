import { parseEffectConfig } from '@reparticle/core';
import { expect, it } from 'vitest';

import effect from '../../public/multiple-emitters.json';

it('loads the composed demo with independent looping and once emitters', () => {
  const parsed = parseEffectConfig(effect);
  expect(parsed.emitters.map(({ id }) => id)).toEqual(['smoke', 'fire', 'sparks']);
  expect(parsed.emitters[0]).toMatchObject({ startDelay: 0.3, playMode: 'loop' });
  expect(parsed.emitters[1]).toMatchObject({ startDelay: 0, playMode: 'loop' });
  expect(parsed.emitters[2]).toMatchObject({ startDelay: 0.15, playMode: 'once' });
});
