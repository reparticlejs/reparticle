import { expect, it } from 'vitest';
import { ZodError } from 'zod';

import { applyEmitterPatch } from '#src/config/apply-emitter-patch.js';
import { parseEffectConfig } from '#src/config/parse-effect.js';

import skeleton from '../../../../docs/effect.example.json';

it('defaults to alpha and accepts all four blend modes in definitions and runtime patches', () => {
  const source = { ...skeleton.emitters[0]!, blendMode: undefined };
  const config = parseEffectConfig({ version: 1, emitters: [source] }).emitters[0];
  expect(config.blendMode).toBe('alpha');
  for (const blendMode of ['alpha', 'add', 'multiply', 'screen'] as const) {
    const parsed = parseEffectConfig({ version: 1, emitters: [{ ...source, blendMode }] });
    expect(parsed.emitters[0].blendMode).toBe(blendMode);
    const changed = applyEmitterPatch(config, { blendMode });
    expect(changed.blendMode).toBe(blendMode);
    expect(applyEmitterPatch(changed, { initial: { size: 10 } }).blendMode).toBe(blendMode);
  }
  expect(config.blendMode).toBe('alpha');
});

it('rejects unsupported blend modes in definitions and patches', () => {
  const config = parseEffectConfig(skeleton).emitters[0];
  for (const blendMode of ['normal', 'additive', '', null, 1]) {
    expect(() => parseEffectConfig({ version: 1, emitters: [{ ...config, blendMode }] })).toThrow(
      ZodError,
    );
    expect(() => applyEmitterPatch(config, { blendMode })).toThrow(ZodError);
  }
});
