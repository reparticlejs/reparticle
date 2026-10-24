import type { z } from 'zod';

import type { renderingSchema } from '#src/config/schemas/definition/rendering.js';

/**
 * Serializable rendering settings with defaults applied. Shared by every renderer.
 * @interface
 */
export type RenderingConfig = z.output<typeof renderingSchema>;
/**
 * Authoring form of the shared rendering settings.
 * @interface
 */
export type RenderingInput = NonNullable<z.input<typeof renderingSchema>>;
export type ParticleBlendMode = RenderingConfig['blendMode'];
export type ParticleTint = NonNullable<RenderingConfig['tint']>;
