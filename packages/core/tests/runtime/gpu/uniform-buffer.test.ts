import { expect, it } from 'vitest';

import { UniformBuffer } from '#src/runtime/gpu/uniform-buffer.js';

it('preserves the cached upload through unchanged steps and a later change', () => {
  const buffer = new UniformBuffer();
  const uploaded = buffer.set(1, 2, 3, 4);
  for (let step = 0; step < 10; step++) {
    expect(buffer.set(1, 2, 3, 4)).toBe(uploaded);
  }

  const changed = buffer.set(5, 2, 3, 4);
  expect(changed).not.toBe(uploaded);
  expect(uploaded).toEqual([1, 2, 3, 4]);
  expect(changed).toEqual([5, 2, 3, 4]);
  expect(buffer.set(5, 2, 3, 4)).toBe(changed);
});

it('reuses only two buffers across continuously changing values', () => {
  const buffer = new UniformBuffer();
  const references = new Set();
  for (let step = 0; step < 100; step++) {
    references.add(buffer.set(step, step + 1, step + 2, step + 3));
  }
  expect(references.size).toBe(2);
});

it('keeps alternating kernels independent when only one has uploaded a change', () => {
  const first = new UniformBuffer();
  const second = new UniformBuffer();
  const firstUpload = first.set(1, 0, 0, 0);
  const secondUpload = second.set(1, 0, 0, 0);

  first.set(2, 0, 0, 0);
  first.set(3, 0, 0, 0);
  expect(secondUpload).toEqual([1, 0, 0, 0]);
  expect(second.set(1, 0, 0, 0)).toBe(secondUpload);
  expect(secondUpload).not.toBe(firstUpload);
});
