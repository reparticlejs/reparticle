/** GPU.js runs one invocation per output texel. These types do not allocate objects. */
export interface KernelContext {
  thread: { x: number; y: number };
  constants: { width: number; rows: number; capacity: number };
}
export type ParticleTexel = [number, number, number, number];
/** Top half: [x, y, vx, vy]. Bottom half: [age, lifetime, initialized, reserved]. */
export type ParticleTexture = ParticleTexel[][];
