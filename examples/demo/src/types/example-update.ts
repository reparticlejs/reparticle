import type { EmitterParameters, RenderingConfig } from '@reparticle/pixi';

/** Changes the player can apply without replacing the effect or its living particles. */
export interface ExampleUpdate {
  emitterId: string;
  parameters?: EmitterParameters;
  rendering?: RenderingConfig;
  artwork?: boolean;
}
