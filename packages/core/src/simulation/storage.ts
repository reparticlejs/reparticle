import { tgpu, d, std } from 'typegpu';

/**
 * Read one packed spawn-mask word, not one particle's spawn flag.
 * Each RGBA texel holds four words; each word contains 24 particle-slot bits.
 * index selects a word, and integrate.ts extracts the bit for the requested slot.
 * Long masks wrap across texture rows. The caller supplies a valid word index.
 * textureLoad reads exact texels without filtering or normalized coordinates.
 */
export const readSpawn = tgpu.fn(
  [d.texture2d(d.f32), d.f32],
  d.f32,
)((mask, index) => {
  'use gpu';
  const word = d.i32(index);
  // Divide by four to locate the texel; word % 4 selects its RGBA component.
  const pixel = d.i32(word / 4);
  const width = d.i32(std.textureDimensions(mask, 0).x);
  return std.textureLoad(mask, d.vec2i(pixel % width, d.i32(pixel / width)), 0)[word % 4]!;
});

/**
 * Reconstruct one logical particle texel from separate state and birth textures.
 * x is the particle column; y includes its logical band offset (band * rows).
 * rows is the number of rows per band, not the full height of either texture.
 * Callers provide valid coordinates and a band from PARTICLE_BAND in data-layout.ts.
 *
 * Physical state bands:
 *   0: position X/Y, velocity X/Y
 *   1: age, active flag, accumulated rotation, movement heading
 * Physical birth bands:
 *   0: lifetime, initial size, initial rotation, modifier variation
 *   1: initial red, green, blue, alpha
 *   2: initial angular velocity, stretch X/Y, handedness
 *
 * Logical bands combine these fields in the order expected by the kernels.
 * Keep this mapping aligned with the output packing in simulation.frag.glsl.
 */
export const readState = tgpu.fn(
  [d.texture2d(d.f32), d.texture2d(d.f32), d.f32, d.f32, d.f32, d.f32],
  d.vec4f,
)((state, birth, birthPass, rows, x, y) => {
  'use gpu';
  // Newborn initialization does not need previous state. Avoid reading the
  // birth texture while it is attached as the current render destination.
  if (birthPass > 0.5) {
    return d.vec4f(0);
  }
  // Strip the logical band offset to recover the particle row in each texture.
  const row = d.i32(y) % d.i32(rows);
  const band = d.i32(d.i32(y) / d.i32(rows));
  const p = d.vec2i(d.i32(x), row);
  const dynamic = std.textureLoad(state, d.vec2i(p.x, row + d.i32(rows)), 0);
  const b0 = std.textureLoad(birth, p, 0);
  const b2 = std.textureLoad(birth, d.vec2i(p.x, row + d.i32(rows) * 2), 0);
  // Motion is already stored as a complete logical texel.
  if (band === 0) {
    return std.textureLoad(state, p, 0);
  }
  // Properties combine changing age with immutable birth values.
  if (band === 1) {
    return d.vec4f(dynamic.x, b0.x, b0.y, b0.z);
  }
  // Initial color is stored entirely in the second birth band.
  if (band === 2) {
    return std.textureLoad(birth, d.vec2i(p.x, row + d.i32(rows)), 0);
  }
  // Dynamics combine active/rotation state with birth variation/angular velocity.
  if (band === 3) {
    return d.vec4f(dynamic.y, b0.w, b2.x, dynamic.z);
  }
  // The remaining valid band is geometry: birth stretch/handedness plus heading.
  return d.vec4f(b2.y, b2.z, b2.w, dynamic.w);
});
