import { expect, it } from 'vitest';

import { mergeEmitterParameters } from '#src/config/merge-emitter-parameters.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';
import { sampleInitialProperties } from '#src/curves/sample-initial-properties.js';

import skeleton from '../../../../docs/effect.example.json';

it('reuses unaffected curves and replaces only patched properties', () => {
  const config = parseEffectConfig(skeleton).emitters[0];
  const previous = sampleInitialProperties(config.initial);
  const patch = { initial: { speed: 42, sizeSpread: 5 } };
  const updated = mergeEmitterParameters(config, patch);
  const next = sampleInitialProperties(updated.initial, previous, patch.initial);

  expect(next.speed).not.toBe(previous.speed);
  expect(next.speed.at(0.5)).toBe(42);
  const unchangedProperties = [
    'lifetime',
    'size',
    'rotation',
    'angularVelocity',
    'stretchX',
    'stretchY',
    'red',
    'green',
    'blue',
    'alpha',
  ] as const;
  for (const property of unchangedProperties) {
    expect(next[property]).toBe(previous[property]);
  }
});

it('keeps previous curves intact if a later patched property overflows float32', () => {
  const config = parseEffectConfig(skeleton).emitters[0];
  const previous = sampleInitialProperties(config.initial);
  const originalSpeed = previous.speed.at(0.5);
  const patch = { initial: { speed: 42, alpha: 1e100 } };
  const updated = mergeEmitterParameters(config, patch);

  expect(() => sampleInitialProperties(updated.initial, previous, patch.initial)).toThrow(
    RangeError,
  );
  expect(previous.speed.at(0.5)).toBe(originalSpeed);
  expect(previous.alpha.at(0.5)).toBe(config.initial.alpha);
});
