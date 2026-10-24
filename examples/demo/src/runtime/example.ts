import { ParticleEffect } from '@reparticle/pixi';
import type { Application, WebGLRenderer } from 'pixi.js';

import type { Example } from '../types/example';
import type { MountedExample } from '../types/mounted-example';
import { runCleanup } from '../utils/run-cleanup';
import { loadArtwork } from './artwork';
import { animateEffect } from './motion';

/**
 * Load configuration and cached artwork, then mount an effect in the shared app.
 * Fetch failures reject. Cancellation after loading returns no mounted effect.
 * Pixi asset loads are shared and are not cancelled or unloaded here.
 */
export async function loadExample(
  app: Application<WebGLRenderer>,
  example: Example,
  signal: AbortSignal,
): Promise<MountedExample | undefined> {
  const config = example.definition ?? (await loadEffectConfig(example.file, signal));
  if (signal.aborted) {
    return undefined;
  }
  const artwork = await loadArtwork(example);
  if (signal.aborted) {
    return undefined;
  }

  const effect = new ParticleEffect(config, {
    ticker: app.ticker,
    emitters: artwork,
  });
  return mountExample(app, example, effect);
}

/** Resolve against Vite's base URL so examples also work under a hosted subpath. */
async function loadEffectConfig(file: string, signal: AbortSignal) {
  const response = await fetch(`${import.meta.env.BASE_URL}${file}`, { signal });
  if (!response.ok) {
    throw new Error(`Unable to load ${file}: ${response.status}`);
  }
  // ParticleEffect validates the loaded definition when it is constructed.
  return response.json();
}

/** Own only this effect's stage entry, resize listener, and optional motion callback. */
function mountExample(
  app: Application<WebGLRenderer>,
  example: Example,
  effect: ParticleEffect,
): MountedExample {
  let motion: ReturnType<typeof animateEffect> | undefined;
  let destroyed = false;

  function resize() {
    layoutExample(effect, example, app.screen.width, app.screen.height);
  }

  function restart() {
    motion?.restart();
    effect.reset();
    effect.autoUpdate = true;
  }

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    runCleanup([
      () => app.renderer.off('resize', resize),
      () => motion?.destroy(),
      () => effect.destroy(),
    ]);
  }

  try {
    resize();
    app.renderer.on('resize', resize);
    if (example.motion) {
      motion = animateEffect(app, effect, example.motion);
    }
    app.stage.addChild(effect);
    return { effect, restart, destroy };
  } catch (error) {
    destroy();
    throw error;
  }
}

/** Center local effects; stretch authored box emitters only on the requested axes. */
function layoutExample(effect: ParticleEffect, example: Example, width: number, height: number) {
  effect.position.set(width / 2, height * (example.verticalPosition ?? 0.5));
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

  for (const emitter of effect.emitters.values()) {
    emitter.setParameters({ emission: { shape: dimensions } });
  }
}
