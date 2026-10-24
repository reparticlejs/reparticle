import { renderingSchema } from '@reparticle/core';
import { Cache, Texture } from 'pixi.js';

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
  const resolved = resolveTextureNames(options);
  const artwork = resolveArtwork(resolved);
  validateArtworkSettings(artwork);

  // resolveArtwork preserves object identity unless it substitutes the placeholder.
  // Warn only after validation succeeds, so rejected settings do not report a fallback.
  const usesPlaceholder = artwork !== resolved;
  if (usesPlaceholder) {
    console.warn(
      '[reparticle] Missing or invalid particle artwork; using the missing-texture placeholder.',
    );
  }

  return { ...artwork, ...appearance };
}

/** Check settings before a renderer is attached; drawing resources are created later. */
function validateArtworkSettings(artwork: ParticleTexture<Texture>): void {
  resolveFlipbook(artwork);
  resolvePivot(artwork.pivot);
  resolveTextureFlip(artwork);
}

/** Resolve loaded cache names once, before validation; never load or own assets here. */
function resolveTextureNames(options: ParticleTexture): ParticleTexture<Texture> {
  if (
    !Array.isArray(options.textures) ||
    !options.textures.some((frame) => typeof frame === 'string')
  ) {
    return options as ParticleTexture<Texture>;
  }
  const textures = options.textures.map((frame) =>
    typeof frame === 'string' ? (Cache.has(frame) ? Cache.get(frame) : undefined) : frame,
  );
  // Mapping preserves tuple length. resolveArtwork checks missing and invalid cache entries.
  return { ...options, textures } as unknown as ParticleTexture<Texture>;
}
