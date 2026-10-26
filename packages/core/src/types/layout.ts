/**
 * CPU test-fixture context for the logical particle-state kernel.
 * Each invocation writes one texel, not one complete particle. These declarations
 * describe the reference texture view; runtime storage uses split GPU textures.
 */
export interface KernelContext {
  /** Output column and row across the full texture, including all five bands. */
  thread: { x: number; y: number };

  /** Allocation dimensions fixed when the kernels are created. */
  constants: {
    /** Texels per row, shared by every band. */
    width: number;
    /** Rows per band; the full texture has rows * 5 rows. */
    rows: number;
    /** Usable particle slots, excluding padding in the final row of each band. */
    capacity: number;
  };
}

/** Four float32 channels in RGBA order; their meanings depend on the row band. */
export type ParticleTexel = [number, number, number, number];

/**
 * Kernel indexing view of particle state: state[row][column][channel].
 * At runtime this input is GPU texture storage, not a CPU nested array.
 *
 * Each fixed particle slot occupies one texel in each of five stacked bands:
 * 0. motion: [x, y, velocityX, velocityY]
 * 1. properties: [age, lifetime, initialSize, initialRotation]
 * 2. color: [initialRed, initialGreen, initialBlue, initialAlpha]
 * 3. dynamics: [active, spreadFactor, initialAngularVelocity, accumulatedRotation]
 * 4. geometry: [initialStretchX, initialStretchY, initialHandedness, movementRotation]
 *
 * Slot id maps to column id % width and row floor(id / width). To read another
 * band, add bandIndex * rows to that row. Slots at or beyond capacity are padding.
 *
 * Positions use simulation-space units, velocities units/s, and ages seconds.
 * Rotations use counterclockwise degrees; angular velocity uses degrees/s.
 * Initial values are captured at birth. The active flag is numeric (0 or 1),
 * spreadFactor is a stable per-particle variation, and initialHandedness is ±1.
 * Movement rotation tracks the pre-modifier velocity heading when movement
 * orientation is enabled; zero-time steps preserve it for existing particles.
 */
export type ParticleTexture = ParticleTexel[][];
