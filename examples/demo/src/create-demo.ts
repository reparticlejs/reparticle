import { parseEffectConfig } from '@reparticle/core';
import { ParticleEffect } from '@reparticle/pixi';
import { Application, Assets, type Spritesheet, type WebGLRenderer } from 'pixi.js';

import { createDemoStats } from './devtools/create-demo-stats';
import type { Stats } from './devtools/types/stats';

/** Mount one fixed effect. Switching demos disposes the previous application. */
export async function createDemo(host: HTMLDivElement, multiple: boolean, signal: AbortSignal) {
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
      background: '#0a111c',
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
    const file = multiple ? 'multiple-emitters.json' : 'effect.json';
    const response = await fetch(`${base}${file}`, { signal });
    if (!response.ok) {
      throw new Error(`Unable to load ${file}: ${response.status}`);
    }
    const definition = parseEffectConfig(await response.json());
    const atlas = await Assets.load<Spritesheet>(`${base}textures/particles.json`);
    if (signal.aborted) {
      return;
    }

    const particles = new ParticleEffect(definition, {
      ticker: app.ticker,
      emitters: {
        sparks: { textures: [multiple ? atlas.textures.spark! : atlas.textures.star!] },
      },
    });
    effect = particles;
    app.stage.addChild(particles);

    function center() {
      particles.position.set(app.screen.width / 2, app.screen.height * 0.7);
    }
    app.renderer.on('resize', center);
    center();
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
