import { tgpu, d } from 'typegpu';

/** Integer-valued float hash: intermediate products stay exactly representable in float32. */
const latticeValue = tgpu
  .fn(
    [d.f32, d.f32, d.f32],
    d.f32,
  )((x, y, seed) => {
    'use gpu';
    const wrappedX = x - Math.floor(x / 251) * 251;
    const wrappedY = y - Math.floor(y / 251) * 251;
    const mixed = wrappedX * 157 + wrappedY * 113 + seed;
    const reduced = mixed - Math.floor(mixed / 4093) * 4093;
    const square = reduced * reduced;
    const hash = square - Math.floor(square / 4093) * 4093;
    return hash / 2046 - 1;
  })
  .$name('noiseLatticeValue');

/**
 * Curl of a quintic-interpolated scalar field: [dN/dy, -dN/dx].
 * Analytic derivatives avoid extra samples and produce continuous, divergence-free
 * swirls. A fixed normalization bounds each force component without flattening
 * the field through per-particle vector normalization. No trigonometric hashes:
 * those can produce unrelated patterns on different GPU vendors.
 */
export const curlNoise = tgpu
  .fn(
    [d.f32, d.f32, d.f32],
    d.vec2f,
  )((x, y, seed) => {
    'use gpu';
    const cellX = Math.floor(x);
    const cellY = Math.floor(y);
    const u = x - cellX;
    const v = y - cellY;
    const smoothX = u * u * u * (u * (u * 6 - 15) + 10);
    const smoothY = v * v * v * (v * (v * 6 - 15) + 10);
    const derivativeX = 30 * u * u * (u - 1) * (u - 1);
    const derivativeY = 30 * v * v * (v - 1) * (v - 1);
    const a = latticeValue(cellX, cellY, seed);
    const b = latticeValue(cellX + 1, cellY, seed);
    const c = latticeValue(cellX, cellY + 1, seed);
    const e = latticeValue(cellX + 1, cellY + 1, seed);
    const dx = derivativeX * ((b - a) * (1 - smoothY) + (e - c) * smoothY);
    const dy = derivativeY * ((c - a) * (1 - smoothX) + (e - b) * smoothX);
    return d.vec2f(dy / 3.75, -dx / 3.75);
  })
  .$name('curlNoise');

/** Sample in authored coordinates; animate by smoothly translating the field in cell units. */
export const applyNoise = tgpu
  .fn(
    [d.vec2f, d.vec2f, d.vec2f, d.f32, d.f32, d.f32, d.f32],
    d.vec2f,
  )((position, origin, axis, frequency, phase, seed, handedness) => {
    'use gpu';
    const dx = position.x - origin.x;
    const dy = position.y - origin.y;
    const x = (axis.x * dx + axis.y * dy) * frequency * handedness;
    const y = (-axis.y * dx + axis.x * dy) * frequency;
    const force = curlNoise(x + phase + 0.37, y + phase * 0.73 + 0.61, seed);
    return d.vec2f(
      axis.x * force.x * handedness - axis.y * force.y,
      axis.y * force.x * handedness + axis.x * force.y,
    );
  })
  .$name('applyNoise');
