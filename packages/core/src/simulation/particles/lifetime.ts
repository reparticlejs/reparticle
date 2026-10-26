import { tgpu, d } from 'typegpu';

/**
 * Advance age by elapsed simulation seconds without clamping to lifetime.
 * The kernel checks expiration using this new age. Newborns receive a full
 * birth step too: their initial age is set directly to that step's duration.
 */
export const advanceAge = tgpu
  .fn(
    [d.f32, d.f32],
    d.f32,
  )((age, seconds) => {
    'use gpu';
    return age + seconds;
  })
  .$name('advanceAge');

/**
 * Return a numeric lifetime flag: 1 while age <= lifetime, otherwise 0.
 * Both arguments are seconds. Equality survives; expiration begins strictly
 * after the boundary, so age zero with lifetime zero returns 1.
 *
 * This checks time only. The kernel combines it with the stored active flag
 * so empty slots stay inactive, and bypasses it for a newborn's first step.
 * Keep the result numeric because it is stored in the GPU state texture.
 */
export const particleAlive = tgpu
  .fn(
    [d.f32, d.f32],
    d.f32,
  )((age, lifetime) => {
    'use gpu';
    if (age > lifetime) {
      return 0;
    }
    return 1;
  })
  .$name('particleAlive');
