/** Mutable CPU array explicitly bound as a GPU.js Array(4), uploaded as a vec4 uniform. */
export type UniformVector = [number, number, number, number];

/**
 * Resolved inputs for one simulation step, not authored effect configuration.
 *
 * An emitter allocates these groups once and updates them in place. Values from
 * emitter-lifetime curves have already been sampled; particle-lifetime curves
 * remain arrays for the kernel to sample separately for each particle.
 *
 * SimulationInputs packs each object group into one vec4, padding unused lanes
 * with zero. The four arrays are borrowed texture inputs, not vec4 uniforms.
 * Positions and velocities use the emitter's local or world simulation space.
 */
export interface SimulationParameters {
  /** Step duration in seconds, accepted births, and deterministic random seed. */
  step: {
    seconds: number;
    birthCount: number;
    /** First births in ascending slot order placed along the travelled path. */
    distanceBirths: number;
    seed: number;
  };

  /** Travel vector in simulation space and normalized positions along the segment. */
  path: { x: number; y: number; firstFraction: number; fractionStep: number };

  /** Birth speed (units/s), direction and full angular spread (radians), lifetime (s). */
  emission: {
    speed: number;
    direction: number;
    spread: number;
    lifetime: number;
  };

  /** Shape dimensions in units, before the birth transform is applied. */
  shape: {
    /** Point = 0, circle = 1, box = 2, cone2d = 3. */
    type: number;
    /** Circle diameter or box/cone width; zero for a point. */
    dimensionX: number;
    /** Box/cone height; zero for a circle or point. */
    dimensionY: number;
  };

  /** Independent random half-ranges added to the shape dimensions at birth. */
  shapeSpread: {
    dimensionX: number;
    dimensionY: number;
  };

  /** Birth size (units), prepared rotation (degrees), and dimensionless axis stretch. */
  appearance: {
    size: number;
    rotation: number;
    stretchX: number;
    stretchY: number;
  };

  /** Initial RGBA values before per-particle spread and lifetime multipliers. */
  color: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };

  /** Birth-property random half-ranges, in the same units as their base values. */
  motionSpread: {
    speed: number;
    lifetime: number;
    size: number;
    rotation: number;
  };

  /** Independent random half-ranges for the initial RGBA components. */
  colorSpread: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };

  /** Random half-ranges for angular velocity (degrees/s) and axis stretch. */
  geometrySpread: {
    angularVelocity: number;
    stretchX: number;
    stretchY: number;
  };

  /** Birth origin (units) and inherited emitter velocity (units/s). */
  position: {
    x: number;
    y: number;
    inheritedVelocityX: number;
    inheritedVelocityY: number;
  };

  /** Birth transform into simulation space; local emission uses the identity. */
  transform: {
    cosine: number;
    sine: number;
    scale: number;
    /** Reflection sign: +1 for ordinary orientation, -1 for mirrored orientation. */
    handedness: number;
  };

  /** Numeric mode flags for GPU.js, plus the sampled birth angular velocity. */
  orientation: {
    /** Align with the initial emission direction when 1; otherwise 0. */
    direction: number;
    /** Follow the particle's movement direction when 1; otherwise 0. */
    movement: number;
    /** Accumulate angular rotation when 1; otherwise 0. */
    angularVelocity: number;
    /** Degrees per second, before per-particle spread. */
    initialAngularVelocity: number;
  };

  /** Birth bits (24 slots per word), followed by birth-count prefixes for those words. */
  spawnMask: Float32Array;

  /** 65 added rotation samples (degrees) spanning normalized particle lifetime [0, 1]. */
  rotationCurve: Float32Array;

  /** 65 angular-velocity multiplier samples spanning normalized particle lifetime [0, 1]. */
  angularVelocityCurve: Float32Array;

  /** Ordered modifier records, including the header written by ModifierSampler. */
  modifiers: Float32Array;
}
