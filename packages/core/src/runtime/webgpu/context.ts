import type { SimulationContext } from '#types/backend.js';
import type { EmitterContext } from '#types/webgpu/emitter.js';

import { WebGPUSimulation } from './particle-simulation';
import { SimulationSubmissions } from './submissions';

/** Borrow the renderer's device; the emitter owns only its simulation allocations. */
export function createSimulationContext(context: EmitterContext): SimulationContext<GPUTexture> {
  const submissions = new SimulationSubmissions(context.device);
  return {
    identity: context.device,
    maxTextureSize: context.device.limits.maxTextureDimension2D,
    assertAvailable: context.assertAvailable,
    batchUpdates: (updates) => submissions.batch(updates),
    flush: () => submissions.publish(),
    createSimulation: (width, rows, capacity) =>
      new WebGPUSimulation(context.device, width, rows, capacity, submissions),
  };
}
