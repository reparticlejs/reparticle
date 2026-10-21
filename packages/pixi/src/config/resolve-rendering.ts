import { renderingSchema } from '@reparticle/core';

import type { ParticleRendering, ResolvedParticleRendering } from '#types/particle-rendering.js';
import type { ParticleTexture } from '#types/particle-texture.js';

import { resolveArtwork } from '../textures/resolve-artwork';
import { resolveFlipbook } from '../textures/resolve-flipbook';
import { resolvePivot } from '../textures/resolve-pivot';
import { resolveTextureFlip } from '../textures/resolve-texture-flip';

/**
 * Prepare renderer settings before creating or replacing an emitter's artwork.
 * Core validates blend mode and tint; Pixi validates textures and their display options.
 *
 * Omitted textures keep procedural particles. Invalid supplied textures use the shared
 * placeholder and produce a warning. Invalid display or animation settings still throw.
 *
 * Returns a new settings object with defaults applied. Textures remain borrowed;
 * this does not upload them, create draw resources, or modify the supplied settings.
 */
export function resolveRendering(options: ParticleRendering): ResolvedParticleRendering {
  const appearance = renderingSchema.parse({
    blendMode: options.blendMode,
    tint: options.tint,
  });
  const artwork = resolveArtwork(options);
  validateArtworkSettings(artwork);

  // resolveArtwork preserves object identity unless it substitutes the placeholder.
  // Warn only after validation succeeds, so rejected settings do not report a fallback.
  const usesPlaceholder = artwork !== options;
  if (usesPlaceholder) {
    console.warn(
      '[reparticle] Missing or invalid particle artwork; using the missing-texture placeholder.',
    );
  }

  return { ...artwork, ...appearance };
}

/** Check settings before a renderer is attached; drawing resources are created later. */
function validateArtworkSettings(artwork: ParticleTexture): void {
  resolveFlipbook(artwork);
  resolvePivot(artwork.pivot);
  resolveTextureFlip(artwork);
}
