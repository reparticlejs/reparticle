import { GPU, type IGPUKernelSettings, type IKernelRunShortcut } from 'gpu.js';

import type { EmitterContext } from '#types/emitter.js';

import functions from '../simulation/functions.json';

/** Create the clear kernel and the two alternating simulation kernels. */
export function createKernels(
  context: EmitterContext,
  width: number,
  rows: number,
  capacity: number,
): IKernelRunShortcut[] {
  const gpu = new GPU({ mode: 'webgl2', canvas: context.canvas, context: context.gl });
  gpu.addFunction(functions.advanceRotation);
  gpu.addFunction(functions.applyAcceleration);
  gpu.addFunction(functions.applyModifiers);
  gpu.addFunction(functions.applyRadial);
  gpu.addFunction(functions.applyVortex);
  gpu.addFunction(functions.particleHeading);
  gpu.addFunction(functions.movementRotation);
  gpu.addFunction(functions.advanceAge);
  // The alive flag is numeric in GPU storage.
  gpu.addFunction(functions.particleAlive, { returnType: 'Number' });
  gpu.addFunction(functions.spawnVariation);
  gpu.addFunction(functions.spawnDirection);
  gpu.addFunction(functions.spawnMotion);
  gpu.addFunction(functions.circleAngle);
  gpu.addFunction(functions.circleRadius);
  gpu.addFunction(functions.spawnCircle);
  gpu.addFunction(functions.spawnBox);
  gpu.addFunction(functions.spawnCone2D);
  gpu.addFunction(functions.spawnRotation);
  gpu.addFunction(functions.propertyVariation);
  gpu.addFunction(functions.applyDrag);
  const config: IGPUKernelSettings = {
    output: [width, rows * 5],
    precision: 'single',
    pipeline: true,
    immutable: false,
    constants: { width, rows, capacity },
  };
  const kernels: IKernelRunShortcut[] = [];
  try {
    for (const source of [functions.initialize, functions.integrate, functions.integrate]) {
      kernels.push(gpu.createKernel(source, config));
    }
    return kernels;
  } catch (error) {
    for (const kernel of kernels) {
      kernel.destroy(true);
    }
    throw error;
  }
}
