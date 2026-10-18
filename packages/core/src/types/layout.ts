/** GPU.js runs one invocation per output texel. These types do not allocate objects. */
export interface KernelContext {
  thread: { x: number; y: number };
  constants: { width: number; rows: number; capacity: number };
}
export type ParticleTexel = [number, number, number, number];
/**
 * Four row bands:
 * motion: [x, y, velocityX, velocityY]
 * properties: [age, lifetime, initialSize, initialRotation]
 * color: [initialRed, initialGreen, initialBlue, initialAlpha]
 * modifiers: [spreadFactor, initialAngularVelocity, accumulatedRotation, reserved]
 * Initial values are captured per particle at spawn.
 */
export type ParticleTexture = ParticleTexel[][];
