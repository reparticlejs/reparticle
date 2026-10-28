import { EmitterController } from '#runtime/emitter-controller.js';
import { EffectTransform } from '#runtime/transforms/effect.js';
import type { SimulationContext } from '#types/backend.js';
import type { EmitterConfig } from '#types/effect.js';
import type { EmitterContext } from '#types/webgl2/emitter.js';

import { createSimulationContext } from './context';

/** Attach shared emitter playback to a WebGL2 simulation using the host's context. */
export class Emitter extends EmitterController<WebGLTexture> {
  public constructor(
    context: EmitterContext | null,
    definition: EmitterConfig,
    sharedModifiers: unknown = [],
    effectTransform = new EffectTransform(),
  ) {
    super(null, definition, sharedModifiers, effectTransform);
    if (context) {
      this.initialize(context);
    }
  }

  public override initialize(context: EmitterContext | SimulationContext<WebGLTexture>): void {
    super.initialize('gl' in context ? createSimulationContext(context) : context);
  }
}
