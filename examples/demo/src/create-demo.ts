import { parseEffectConfig } from '@reparticle/core';
import { ParticleEffect } from '@reparticle/pixi';
import { Application, type WebGLRenderer } from 'pixi.js';

import { animateEmitter } from './animate-emitter';
import { createDemoStats } from './devtools/create-demo-stats';
import type { Stats } from './devtools/types/stats';
import { loadArtwork } from './load-artwork';
import type { Example } from './types/example';

/** Mount one fixed effect. Switching demos disposes the previous application. */
export async function createDemo(host: HTMLDivElement, example: Example, signal: AbortSignal) {
  const app = new Application<WebGLRenderer>();
  let mounted = false;
  let stats: Stats | undefined;
  let effect: ParticleEffect | undefined;

  function destroy() {
    stats?.destroy();
    // Detach the effect before Application destroys its ticker.
    effect?.destroy();
    if (app.renderer) {
      app.destroy(true, { children: true });
    } else {
      app.stage.destroy({ children: true });
    }
  }

  try {
    await app.init({
      resizeTo: host,
      background: '#666666',
      preference: 'webgl',
      preferWebGLVersion: 2,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      autoStart: false,
    });
    if (signal.aborted) {
      return;
    }

    const base = import.meta.env.BASE_URL;
    const file = example.file;
    const response = await fetch(`${base}${file}`, { signal });
    if (!response.ok) {
      throw new Error(`Unable to load ${file}: ${response.status}`);
    }
    const definition = parseEffectConfig(await response.json());
    const artwork = await loadArtwork(example);
    if (signal.aborted) {
      return;
    }

    const particles = new ParticleEffect(definition, {
      ticker: app.ticker,
      emitters: artwork,
    });
    effect = particles;
    app.stage.addChild(particles);

    function layout() {
      particles.position.set(
        app.screen.width / 2,
        app.screen.height * (example.verticalPosition ?? 0.5),
      );
      if (example.fullWidth) {
        for (const emitter of particles.emitters.values()) {
          emitter.setParameters({ emission: { shape: { width: app.screen.width } } });
        }
      }
    }
    app.renderer.on('resize', layout);
    layout();
    const restartMotion = example.motion
      ? animateEmitter(app, particles, example.motion)
      : undefined;
    host.appendChild(app.canvas);
    stats = createDemoStats(app, host, particles);
    app.start();
    mounted = true;
    return {
      destroy,
      setPaused(paused: boolean) {
        particles.autoUpdate = !paused;
      },
      restart() {
        restartMotion?.();
        particles.reset();
        particles.autoUpdate = true;
      },
    };
  } finally {
    if (!mounted) {
      destroy();
    }
  }
}
