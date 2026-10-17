/** GPU.js runs one invocation per output texel. These types do not allocate objects. */
export interface KernelContext {
  thread: { x: number; y: number };
  constants: { width: number; rows: number; capacity: number };
}
export type ParticleTexel = [number, number, number, number];
/** Three row bands: motion [x, y, vx, vy], lifetime [age, lifetime, birthSize, reserved], color [birthRed, birthGreen, birthBlue, birthAlpha]. */
export type ParticleTexture = ParticleTexel[][];
