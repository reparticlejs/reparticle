import { parseEffectConfig } from '@reparticle/core';
import { ParticleEffect } from '@reparticle/pixi';
import type { Application, WebGLRenderer } from 'pixi.js';

import { animateEmitter } from './animate-emitter';
import { loadArtwork } from './load-artwork';
import type { Example } from './types/example';

/** Load one selection; cancellation prevents a stale request from mounting an effect. */
export async function loadExample(
  app: Application<WebGLRenderer>,
  example: Example,
  signal: AbortSignal,
) {
  const response = await fetch(`${import.meta.env.BASE_URL}${example.file}`, { signal });
  if (!response.ok) {
    throw new Error(`Unable to load ${example.file}: ${response.status}`);
  }
  const definition = parseEffectConfig(await response.json());
  const artwork = await loadArtwork(example);
  if (signal.aborted) {
    return undefined;
  }

  const particles = new ParticleEffect(definition, {
    ticker: app.ticker,
    emitters: artwork,
  });
  let motion: ReturnType<typeof animateEmitter> | undefined;

  function layout() {
    particles.position.set(
      app.screen.width / 2,
      app.screen.height * (example.verticalPosition ?? 0.5),
    );
    for (const emitter of particles.emitters.values()) {
      if (example.fullWidth) {
        emitter.setParameters({ emission: { shape: { width: app.screen.width } } });
      }
      if (example.fullHeight) {
        emitter.setParameters({ emission: { shape: { height: app.screen.height } } });
      }
    }
  }

  function destroy() {
    app.renderer.off('resize', layout);
    motion?.destroy();
    particles.destroy();
  }

  try {
    layout();
    app.renderer.on('resize', layout);
    if (example.motion) {
      motion = animateEmitter(app, particles, example.motion);
    }
    app.stage.addChild(particles);
    return {
      particles,
      destroy,
      restart() {
        motion?.restart();
        particles.reset();
        particles.autoUpdate = true;
      },
    };
  } catch (error) {
    destroy();
    throw error;
  }
}
