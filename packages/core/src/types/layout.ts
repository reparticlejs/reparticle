/** GPU.js runs one invocation per output texel. These types do not allocate objects. */
export interface KernelContext {
  thread: { x: number; y: number };
  constants: { width: number; rows: number; capacity: number };
}
export type ParticleTexel = [number, number, number, number];
/**
 * Five row bands:
 * motion: [x, y, velocityX, velocityY]
 * properties: [age, lifetime, initialSize, initialRotation]
 * color: [initialRed, initialGreen, initialBlue, initialAlpha]
 * dynamics: [active, spreadFactor, initialAngularVelocity, accumulatedRotation]
 * geometry: [initialStretchX, initialStretchY, initialHandedness, movementRotation]
 * Initial values are captured per particle at spawn. Movement rotation is the
 * pre-modifier velocity heading in degrees, refreshed each positive simulation step.
 */
export type ParticleTexture = ParticleTexel[][];
