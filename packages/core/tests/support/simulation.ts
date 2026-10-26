import { d } from 'typegpu';
import { vi } from 'vitest';

import { integrate as shaderIntegrate } from '#simulation/kernels/integrate.js';
import { applyModifiers as shaderApplyModifiers } from '#simulation/modifiers/list.js';
import { advanceRotation as shaderAdvanceRotation } from '#simulation/particles/angular-velocity.js';
import { particleHeading as shaderParticleHeading } from '#simulation/particles/heading.js';
import type { KernelContext, ParticleTexel, ParticleTexture } from '#types/layout.js';
import type { UniformVector } from '#types/simulation.js';

import { inputs } from './shader-inputs';

/** Preserve the test fixture format, while executing the new authored TypeGPU kernel. */
export function integrate(
  this: KernelContext,
  state: ParticleTexture,
  step: UniformVector,
  emission: UniformVector,
  shape: UniformVector,
  shapeSpread: UniformVector,
  appearance: UniformVector,
  color: UniformVector,
  motionSpread: UniformVector,
  colorSpread: UniformVector,
  geometrySpread: UniformVector,
  position: UniformVector,
  transform: UniformVector,
  orientation: UniformVector,
  mask: Float32Array,
  rotation: Float32Array,
  angular: Float32Array,
  modifiers: Float32Array,
): ParticleTexel {
  inputs.state = state;
  inputs.mask = mask;
  inputs.rotation = rotation;
  inputs.angular = angular;
  inputs.modifiers = modifiers;
  // Opaque test handles: the mocked storage readers use inputs.state / inputs.mask.
  const texture = vi.fn<() => Parameters<typeof shaderIntegrate>[0]>()();
  const spawn = vi.fn<() => Parameters<typeof shaderIntegrate>[13]>()();
  const result = shaderIntegrate(
    texture,
    d.vec4f(...step),
    d.vec4f(...emission),
    d.vec4f(...shape),
    d.vec4f(...shapeSpread),
    d.vec4f(...appearance),
    d.vec4f(...color),
    d.vec4f(...motionSpread),
    d.vec4f(...colorSpread),
    d.vec4f(...geometrySpread),
    d.vec4f(...position),
    d.vec4f(...transform),
    d.vec4f(...orientation),
    spawn,
    0,
    1,
    this.thread.x,
    this.thread.y,
    this.constants.width,
    this.constants.rows,
    this.constants.capacity,
    texture,
    0,
  );
  return [result.x, result.y, result.z, result.w];
}
export function advanceRotation(
  rotation: number,
  speed: number,
  age: number,
  lifetime: number,
  curve: Float32Array,
  seconds: number,
) {
  inputs.angular = curve;
  return shaderAdvanceRotation(rotation, speed, age, lifetime, 1, seconds);
}
export function particleHeading(
  rotation: number,
  age: number,
  lifetime: number,
  curve: Float32Array,
  vx: number,
  vy: number,
  movement: number,
  handedness: number,
) {
  inputs.rotation = curve;
  return shaderParticleHeading(rotation, age, lifetime, 0, vx, vy, movement, handedness);
}
export function applyModifiers(
  x: number,
  y: number,
  vx: number,
  vy: number,
  hx: number,
  hy: number,
  spread: number,
  seconds: number,
  modifiers: Float32Array,
) {
  inputs.modifiers = modifiers;
  return shaderApplyModifiers(x, y, vx, vy, hx, hy, spread, seconds);
}
