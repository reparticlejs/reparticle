import { GPU, type IGPUKernelSettings, type IKernelRunShortcut } from 'gpu.js';

import type { EmitterContext } from '#types/emitter.js';

import functions from '../../simulation/functions.json';

/**
 * Create kernels on the renderer's existing WebGL2 context.
 *
 * Returned order is significant: [initialize, update A, update B]. Updates use
 * the same source but own separate output textures, so one can read the previous
 * result while writing the next. GpuSimulation owns execution and destruction.
 * GPU.js compiles lazily; the emitter warms these kernels before playback.
 *
 * `width` and `rows` describe one band of particle slots; `capacity` is the number
 * of usable slots, excluding padding at the end of that band.
 */
export function createKernels(
  context: EmitterContext,
  width: number,
  rows: number,
  capacity: number,
): IKernelRunShortcut[] {
  const gpu = new GPU({ mode: 'webgl2', canvas: context.canvas, context: context.gl });
  registerSimulationFunctions(gpu);

  const config: IGPUKernelSettings = {
    // One RGBA texel per particle in each band: motion, properties, color,
    // dynamics, and geometry. See ParticleTexture for the channel layout.
    output: [width, rows * 5],
    precision: 'single', // Store simulation values as float32.
    pipeline: true, // Return GPU textures without reading particle data back.
    immutable: false, // Each kernel reuses its own output texture.
    constants: { width, rows, capacity },
  };

  const sources = [
    functions.initialize,
    functions.integrate, // Update A
    functions.integrate, // Update B
  ];
  const kernels: IKernelRunShortcut[] = [];
  try {
    for (const source of sources) {
      kernels.push(gpu.createKernel(source, config));
    }
    return kernels;
  } catch (error) {
    // The caller never receives these kernels if creation fails partway through.
    for (const kernel of kernels) {
      kernel.destroy(true);
    }
    throw error;
  }
}

/** Register the build-generated helper strings called by the simulation kernels. */
function registerSimulationFunctions(gpu: GPU): void {
  // Emission and per-particle variation
  gpu.addFunction(functions.spawnVariation);
  gpu.addFunction(functions.propertyVariation);
  gpu.addFunction(functions.spawnDirection);
  gpu.addFunction(functions.spawnMotion);
  gpu.addFunction(functions.spawnRotation);
  gpu.addFunction(functions.circleAngle);
  gpu.addFunction(functions.circleRadius);
  gpu.addFunction(functions.spawnCircle);
  gpu.addFunction(functions.spawnBox);
  gpu.addFunction(functions.spawnCone2D);

  // Particle age and orientation
  gpu.addFunction(functions.advanceAge);
  gpu.addFunction(functions.advanceRotation);
  gpu.addFunction(functions.particleHeading);
  gpu.addFunction(functions.movementRotation);
  // The alive flag is stored as a number, even when minified branches look boolean.
  gpu.addFunction(functions.particleAlive, { returnType: 'Number' });

  // Forces applied during integration
  gpu.addFunction(functions.applyAcceleration);
  gpu.addFunction(functions.applyDrag);
  gpu.addFunction(functions.applyRadial);
  gpu.addFunction(functions.applyVortex);
  gpu.addFunction(functions.applyModifiers);
}
