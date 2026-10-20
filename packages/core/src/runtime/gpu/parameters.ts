import type { SimulationParameters } from '#types/simulation.js';

/** Allocate once per emitter; callers mutate groups and replace texture-array references. */
export function createSimulationParameters(): SimulationParameters {
  return {
    step: { seconds: 0, birthCount: 0, seed: 0 },
    emission: { speed: 0, direction: 0, spread: 0, lifetime: 0 },
    shape: { type: 0, dimensionX: 0, dimensionY: 0 },
    shapeSpread: { dimensionX: 0, dimensionY: 0 },
    appearance: { size: 0, rotation: 0, stretchX: 0, stretchY: 0 },
    color: { red: 0, green: 0, blue: 0, alpha: 0 },
    motionSpread: { speed: 0, lifetime: 0, size: 0, rotation: 0 },
    colorSpread: { red: 0, green: 0, blue: 0, alpha: 0 },
    geometrySpread: { angularVelocity: 0, stretchX: 0, stretchY: 0 },
    position: { x: 0, y: 0, inheritedVelocityX: 0, inheritedVelocityY: 0 },
    transform: { cosine: 0, sine: 0, scale: 0, handedness: 0 },
    orientation: { direction: 0, movement: 0, angularVelocity: 0, initialAngularVelocity: 0 },
    spawnMask: new Float32Array(0),
    rotationCurve: new Float32Array(0),
    angularVelocityCurve: new Float32Array(0),
    modifiers: new Float32Array(0),
  };
}
