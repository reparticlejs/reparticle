import { EmitterController } from '#runtime/emitter-controller.js';
import { EffectTransform } from '#runtime/transforms/effect.js';
import type { SimulationContext } from '#types/backend.js';
import type { EmitterConfig } from '#types/effect.js';
import type { EmitterContext } from '#types/webgpu/emitter.js';

import { createSimulationContext } from './context';

/** WebGPU emitter with the same playback API; the host supplies its shared device. */
export class Emitter extends EmitterController<GPUTexture> {
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

  public override initialize(context: EmitterContext | SimulationContext<GPUTexture>): void {
    super.initialize('device' in context ? createSimulationContext(context) : context);
  }
}
