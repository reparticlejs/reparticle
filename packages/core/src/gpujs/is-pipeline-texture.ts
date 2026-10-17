import { Texture } from 'gpu.js';

import type { PipelineTexture } from '#types/emitter.js';

/** Validate GPU.js's shared-context output before exposing it to a renderer. */
export function isPipelineTexture(
  value: unknown,
  gl: WebGL2RenderingContext,
): value is PipelineTexture {
  return (
    value instanceof Texture &&
    'context' in value &&
    value.context === gl &&
    'texture' in value &&
    typeof value.texture === 'object' &&
    value.texture !== null
  );
}
