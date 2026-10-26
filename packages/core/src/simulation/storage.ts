import { tgpu, d, std } from 'typegpu';

export const readSpawn = tgpu.fn(
  [d.texture2d(d.f32), d.f32],
  d.f32,
)((mask, index) => {
  'use gpu';
  const word = d.i32(index);
  const pixel = d.i32(word / 4);
  const width = d.i32(std.textureDimensions(mask, 0).x);
  return std.textureLoad(mask, d.vec2i(pixel % width, d.i32(pixel / width)), 0)[word % 4]!;
});

// Reconstruct the five logical bands from two changing-state bands and three
// birth bands. The birth pass must never sample its framebuffer attachment.
export const readState = tgpu.fn(
  [d.texture2d(d.f32), d.texture2d(d.f32), d.f32, d.f32, d.f32, d.f32],
  d.vec4f,
)((state, birth, birthPass, rows, x, y) => {
  'use gpu';
  if (birthPass > 0.5) {
    return d.vec4f(0);
  }
  const row = d.i32(y) % d.i32(rows);
  const band = d.i32(d.i32(y) / d.i32(rows));
  const p = d.vec2i(d.i32(x), row);
  const dynamic = std.textureLoad(state, d.vec2i(p.x, row + d.i32(rows)), 0);
  const b0 = std.textureLoad(birth, p, 0);
  const b2 = std.textureLoad(birth, d.vec2i(p.x, row + d.i32(rows) * 2), 0);
  if (band === 0) {
    return std.textureLoad(state, p, 0);
  }
  if (band === 1) {
    return d.vec4f(dynamic.x, b0.x, b0.y, b0.z);
  }
  if (band === 2) {
    return std.textureLoad(birth, d.vec2i(p.x, row + d.i32(rows)), 0);
  }
  if (band === 3) {
    return d.vec4f(dynamic.y, b0.w, b2.x, dynamic.z);
  }
  return d.vec4f(b2.y, b2.z, b2.w, dynamic.w);
});
