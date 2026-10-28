import type { SimulationContext } from '#types/backend.js';
import type { EmitterContext } from '#types/webgl2/emitter.js';

import { WebGL2Simulation } from './particle-simulation';

/** Keep WebGL imports behind the explicit WebGL2 entry point. */
export function createSimulationContext(context: EmitterContext): SimulationContext<WebGLTexture> {
  return {
    identity: context.gl,
    maxTextureSize: context.gl.getParameter(context.gl.MAX_TEXTURE_SIZE),
    assertAvailable: context.assertAvailable,
    restoreState: context.restoreState,
    createSimulation: (width, rows, capacity) =>
      new WebGL2Simulation(context, width, rows, capacity),
  };
}
