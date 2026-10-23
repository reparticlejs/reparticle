import type { ParticleEffect } from '@reparticle/pixi';
import { type Application, UPDATE_PRIORITY, type WebGLRenderer } from 'pixi.js';

import type { Stats } from './types/stats';

const SAMPLE_INTERVAL_MS = 200;
const EMPTY_STATS = 'WebGL2 · GPU.js\n0 particles\n— fps';

/**
 * Keep one text overlay for the application's lifetime, sampling five times a second.
 * FPS measures ticker callbacks against wall-clock time, not GPU execution time.
 * Particle counts come from CPU bookkeeping; no GPU readback is performed.
 */
export function createStats(app: Application<WebGLRenderer>, host: HTMLElement): Stats {
  const overlay = document.createElement('div');
  overlay.className = 'demo-stats';
  overlay.textContent = EMPTY_STATS;

  let activeEffect: ParticleEffect | undefined;
  let sampleStartedAt = performance.now();
  let framesSinceSample = 0;

  function update() {
    framesSinceSample += 1;
    const now = performance.now();
    const elapsedMs = now - sampleStartedAt;
    if (elapsedMs < SAMPLE_INTERVAL_MS) {
      return;
    }

    // Ignore ticker speed and delta clamping: report actual callback frequency.
    const fps = Math.round((framesSinceSample * 1000) / elapsedMs);
    const particleCount = countParticles(activeEffect);
    overlay.textContent = `WebGL2 · GPU.js\n${particleCount} particles\n${fps} fps`;

    sampleStartedAt = now;
    framesSinceSample = 0;
  }

  /** Switch the observed effect and discard timing from the previous selection. */
  function setEffect(effect: ParticleEffect | undefined) {
    activeEffect = effect;
    sampleStartedAt = performance.now();
    framesSinceSample = 0;
    overlay.textContent = EMPTY_STATS;
  }

  /** Remove the observer and overlay without destroying the effect or shared ticker. */
  function destroy() {
    app.ticker.remove(update);
    activeEffect = undefined;
    overlay.remove();
  }

  host.appendChild(overlay);
  app.ticker.add(update, undefined, UPDATE_PRIORITY.UTILITY);
  return { setEffect, destroy };
}

/** Sum living particles across emitters, including particles outside the viewport. */
function countParticles(effect: ParticleEffect | undefined): number {
  if (!effect) {
    return 0;
  }

  let count = 0;
  for (const emitter of effect.emitters.values()) {
    count += emitter.particleCount;
  }
  return count;
}
