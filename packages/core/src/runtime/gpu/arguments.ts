import type { IGPUKernelSettings } from 'gpu.js';

/**
 * GPU.js input declarations for integrate(), shared by runtime and package build.
 *
 * Keys must match kernel parameter names and their positional order in
 * SimulationInputs. GPU.js uses the values to compile each input's GLSL type and
 * upload path. The build reserves the keys during mangling so lookup still works.
 *
 * Keep this module declarative: the build imports it directly through Node.
 * The GPU.js import is type-only and loads no GPU runtime here.
 * initialize() takes no arguments, so it needs no declarations.
 */
export const INTEGRATION_ARGUMENT_TYPES: NonNullable<IGPUKernelSettings['argumentTypes']> = {
  // Existing RGBA pipeline texture: sampled on the GPU without a CPU readback.
  state: 'ArrayTexture(4)',

  // Fixed four-number groups uploaded as vec4 uniforms. Explicit Array(4) avoids
  // GPU.js treating ordinary numeric arrays as texture-backed inputs.
  stepInput: 'Array(4)',
  emissionInput: 'Array(4)',
  shapeInput: 'Array(4)',
  shapeSpreadInput: 'Array(4)',

  // Birth properties and their per-particle variation.
  appearanceInput: 'Array(4)',
  colorInput: 'Array(4)',
  motionSpreadInput: 'Array(4)',
  colorSpreadInput: 'Array(4)',
  geometrySpreadInput: 'Array(4)',

  // Birth transform, inherited velocity, and orientation controls.
  positionInput: 'Array(4)',
  transformInput: 'Array(4)',
  orientationInput: 'Array(4)',

  // Float32Array data uploaded as textures, indexed by slot, curve sample, or
  // modifier record. These arrays are not fixed-size vec4 uniform groups.
  spawnMask: 'Array',
  rotationCurve: 'Array',
  angularVelocityCurve: 'Array',
  modifiers: 'Array',
};
