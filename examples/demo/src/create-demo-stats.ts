import type { ParticleEffect } from '@reparticle/pixi';
import { type Application, UPDATE_PRIORITY, type WebGLRenderer } from 'pixi.js';

const SAMPLE_INTERVAL_MS = 200;

/** Three text lines, sampled twice per second; no graphs or WebGL instrumentation. */
export function createDemoStats(
  app: Application<WebGLRenderer>,
  host: HTMLElement,
  effect: ParticleEffect,
) {
  const overlay = document.createElement('div');
  overlay.className = 'demo-stats';
  overlay.textContent = 'WebGL2 · GPU.js\n0 particles\n— fps';
  host.appendChild(overlay);

  // Live counts are already tracked by the allocator.
  const emitters = [...effect.emitters.values()];
  let sampleStart = performance.now();
  let frames = 0;

  function update() {
    frames += 1;
    const now = performance.now();
    const elapsed = now - sampleStart;
    if (elapsed < SAMPLE_INTERVAL_MS) {
      return;
    }

    let particleCount = 0;
    for (const emitter of emitters) {
      particleCount += emitter.particleCount;
    }
    // Wall-clock time keeps FPS independent of ticker speed and delta-time clamping.
    const fps = Math.round((frames * 1000) / elapsed);
    overlay.textContent = `WebGL2 · GPU.js\n${particleCount} particles\n${fps} fps`;
    sampleStart = now;
    frames = 0;
  }

  app.ticker.add(update, undefined, UPDATE_PRIORITY.UTILITY);
  return {
    destroy() {
      app.ticker.remove(update);
      overlay.remove();
    },
  };
}
