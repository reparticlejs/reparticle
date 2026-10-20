import type { IGPUKernelSettings } from 'gpu.js';

/**
 * Shared integrate() argument contract, in kernel parameter order.
 * Runtime uses these types to keep scalar groups in vec4 uniforms rather than
 * textures. The build reserves these names when mangling GPU function sources.
 * initialize() has no arguments and needs no mapping.
 */
export const INTEGRATION_ARGUMENT_TYPES: NonNullable<IGPUKernelSettings['argumentTypes']> = {
  state: 'ArrayTexture(4)',
  stepInput: 'Array(4)',
  emissionInput: 'Array(4)',
  shapeInput: 'Array(4)',
  shapeSpreadInput: 'Array(4)',
  appearanceInput: 'Array(4)',
  colorInput: 'Array(4)',
  motionSpreadInput: 'Array(4)',
  colorSpreadInput: 'Array(4)',
  geometrySpreadInput: 'Array(4)',
  positionInput: 'Array(4)',
  transformInput: 'Array(4)',
  orientationInput: 'Array(4)',
  spawnMask: 'Array',
  rotationCurve: 'Array',
  angularVelocityCurve: 'Array',
  modifiers: 'Array',
};
