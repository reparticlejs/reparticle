/** Four scalar uniforms, uploaded as one vec4 rather than a texture. */
export type UniformVector = [number, number, number, number];

/** Mutable parameter groups owned by one emitter and reused for every step. */
export interface SimulationParameters {
  step: {
    seconds: number;
    birthCount: number;
    seed: number;
  };
  emission: {
    speed: number;
    direction: number;
    spread: number;
    lifetime: number;
  };
  shape: {
    type: number;
    dimensionX: number;
    dimensionY: number;
  };
  shapeSpread: {
    dimensionX: number;
    dimensionY: number;
  };
  appearance: {
    size: number;
    rotation: number;
    stretchX: number;
    stretchY: number;
  };
  color: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };
  motionSpread: {
    speed: number;
    lifetime: number;
    size: number;
    rotation: number;
  };
  colorSpread: {
    red: number;
    green: number;
    blue: number;
    alpha: number;
  };
  geometrySpread: {
    angularVelocity: number;
    stretchX: number;
    stretchY: number;
  };
  position: {
    x: number;
    y: number;
    inheritedVelocityX: number;
    inheritedVelocityY: number;
  };
  transform: {
    cosine: number;
    sine: number;
    scale: number;
    handedness: number;
  };
  orientation: {
    direction: number;
    movement: number;
    angularVelocity: number;
    initialAngularVelocity: number;
  };
  spawnMask: Float32Array;
  rotationCurve: Float32Array;
  angularVelocityCurve: Float32Array;
  modifiers: Float32Array;
}
