import { parseEffectConfig } from '@reparticle/core';
import { ParticleEffect } from '@reparticle/pixi';
import type { Application, WebGLRenderer } from 'pixi.js';

import { animateEmitter } from './animate-emitter';
import { loadArtwork } from './load-artwork';
import type { Example } from './types/example';
import type { LoadedExample } from './types/example-player';
import { runCleanup } from './utils/run-cleanup';

/**
 * Load configuration and cached artwork, then mount an effect in the shared app.
 * Fetch failures reject. Cancellation after loading returns no mounted effect.
 * Pixi asset loads are shared and are not cancelled or unloaded here.
 */
export async function loadExample(
  app: Application<WebGLRenderer>,
  example: Example,
  signal: AbortSignal,
): Promise<LoadedExample | undefined> {
  const definition = await loadDefinition(example.file, signal);
  if (signal.aborted) {
    return undefined;
  }
  const artwork = await loadArtwork(example);
  if (signal.aborted) {
    return undefined;
  }

  const particles = new ParticleEffect(definition, {
    ticker: app.ticker,
    emitters: artwork,
  });
  return mountExample(app, example, particles);
}

/** Resolve against Vite's base URL so examples also work under a hosted subpath. */
async function loadDefinition(file: string, signal: AbortSignal) {
  const response = await fetch(`${import.meta.env.BASE_URL}${file}`, { signal });
  if (!response.ok) {
    throw new Error(`Unable to load ${file}: ${response.status}`);
  }
  return parseEffectConfig(await response.json());
}

/** Own only this effect's stage entry, resize listener, and optional motion callback. */
function mountExample(
  app: Application<WebGLRenderer>,
  example: Example,
  particles: ParticleEffect,
): LoadedExample {
  let motion: ReturnType<typeof animateEmitter> | undefined;
  let destroyed = false;

  function resize() {
    layoutExample(particles, example, app.screen.width, app.screen.height);
  }

  function restart() {
    motion?.restart();
    particles.reset();
    particles.autoUpdate = true;
  }

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    runCleanup([
      () => app.renderer.off('resize', resize),
      () => motion?.destroy(),
      () => particles.destroy(),
    ]);
  }

  try {
    resize();
    app.renderer.on('resize', resize);
    if (example.motion) {
      motion = animateEmitter(app, particles, example.motion);
    }
    app.stage.addChild(particles);
    return { particles, restart, destroy };
  } catch (error) {
    destroy();
    throw error;
  }
}

/** Center local effects; stretch authored box emitters only on the requested axes. */
function layoutExample(particles: ParticleEffect, example: Example, width: number, height: number) {
  particles.position.set(width / 2, height * (example.verticalPosition ?? 0.5));
  if (!example.fullWidth && !example.fullHeight) {
    return;
  }

  const dimensions: { width?: number; height?: number } = {};
  if (example.fullWidth) {
    dimensions.width = width;
  }
  if (example.fullHeight) {
    dimensions.height = height;
  }

  for (const emitter of particles.emitters.values()) {
    emitter.setParameters({ emission: { shape: dimensions } });
  }
}
