import { expect, it } from 'vitest';

import { kernelSource } from '#src/gpujs/kernel-source.js';

it('escapes dollar identifiers consistently without colliding with existing underscores', () => {
  const source = { toString: () => 'function $(a$, a_dollar_) { return a$ + a_dollar_; }' };
  expect(kernelSource(source)).toBe(
    'function _dollar_(a_dollar_, a_underscore_dollar_underscore_) { return a_dollar_ + a_underscore_dollar_underscore_; }',
  );
});
