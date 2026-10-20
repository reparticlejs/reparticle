import type { SimulationParameters } from '#types/simulation.js';

/**
 * Allocate the mutable parameter groups once for an emitter.
 *
 * Zeroes initialize storage; they are not effect defaults or a runnable step.
 * Emitter.integrate() fills every group before its first update and mutates
 * the same objects afterward. SimulationInputs packs them into GPU uniforms.
 *
 * Texture inputs start empty. The emitter replaces these references with its
 * spawn mask, sampled curves, and modifier buffer before running the kernel.
 */
export function createSimulationParameters(): SimulationParameters {
  const emptyTextureInput = new Float32Array(0);

  return {
    // Timestep, births, and sampled emission shape.
    step: { seconds: 0, birthCount: 0, seed: 0 },
    emission: { speed: 0, direction: 0, spread: 0, lifetime: 0 },
    shape: { type: 0, dimensionX: 0, dimensionY: 0 },
    shapeSpread: { dimensionX: 0, dimensionY: 0 },

    // Values captured at birth and their per-particle variation.
    appearance: { size: 0, rotation: 0, stretchX: 0, stretchY: 0 },
    color: { red: 0, green: 0, blue: 0, alpha: 0 },
    motionSpread: { speed: 0, lifetime: 0, size: 0, rotation: 0 },
    colorSpread: { red: 0, green: 0, blue: 0, alpha: 0 },
    geometrySpread: { angularVelocity: 0, stretchX: 0, stretchY: 0 },

    // Simulation-space transform and orientation controls.
    position: { x: 0, y: 0, inheritedVelocityX: 0, inheritedVelocityY: 0 },
    transform: { cosine: 0, sine: 0, scale: 0, handedness: 0 },
    orientation: { direction: 0, movement: 0, angularVelocity: 0, initialAngularVelocity: 0 },

    // Shared empty placeholder only; actual input arrays remain independently owned.
    spawnMask: emptyTextureInput,
    rotationCurve: emptyTextureInput,
    angularVelocityCurve: emptyTextureInput,
    modifiers: emptyTextureInput,
  };
}
