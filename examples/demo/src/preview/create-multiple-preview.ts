import { parseEffectConfig } from '@reparticle/core';
import type { Transform } from '@reparticle/core';
import { ParticleEffect, type ParticleTint, type ParticleStateListener } from '@reparticle/pixi';
import { Application, Assets, type Spritesheet, type WebGLRenderer } from 'pixi.js';

import { destroyApplication } from './destroy-application';

/** Small composed-effect example, independent of the single-emitter controls. */
export async function createMultiplePreview(
  host: HTMLDivElement,
  signal: AbortSignal,
  onStateChange: ParticleStateListener,
) {
  const app = new Application<WebGLRenderer>();
  let ready = false;
  try {
    await app.init({
      resizeTo: host,
      background: '#0a111c',
      preference: 'webgl',
      preferWebGLVersion: 2,
      autoStart: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });
    const base = import.meta.env.BASE_URL;
    const response = await fetch(`${base}multiple-emitters.json`, { signal });
    if (!response.ok) {
      throw new Error(`Unable to load multiple-emitters.json: ${response.status}`);
    }
    const effect: unknown = await response.json();
    const atlas = await Assets.load<Spritesheet>(`${base}textures/particles.json`);
    if (signal.aborted) {
      return null;
    }
    const definition = parseEffectConfig(effect);
    const view = new ParticleEffect(definition, {
      autoUpdate: false,
      emitters: { sparks: { textures: [atlas.textures.spark!] } },
    });
    view.position.set(app.screen.width / 2, app.screen.height * 0.7);
    app.stage.addChild(view);
    view.on('statechange', onStateChange);
    for (const emitter of view.emitters.values()) {
      onStateChange({
        emitterId: emitter.id,
        state: emitter.state,
        awakeEmitters: view.awakeEmitters,
      });
    }
    app.ticker.add(({ deltaMS }) => view.update(Math.min(deltaMS / 1000, 0.05)));
    host.appendChild(app.canvas);
    app.start();
    ready = true;
    return {
      setTransform: (transform: Pick<Transform, 'x' | 'y' | 'rotation' | 'scale'>) => {
        view.position.set(
          app.screen.width / 2 + transform.x,
          app.screen.height * 0.7 + transform.y,
        );
        view.angle = -transform.rotation;
        view.scale.set(transform.scale);
      },
      setTint: (id: string, tint: ParticleTint) => {
        view.setEmitterTint(id, tint);
        app.render();
      },
      resetTint: (id: string) => {
        view.resetEmitterTint(id);
        app.render();
      },
      play: () => view.play(),
      stop: () => view.stop(),
      retire: () => view.retire(),
      clear: () => view.clear(),
      pause: (paused: boolean) => (paused ? app.stop() : app.start()),
      destroy: () => destroyApplication(app),
    };
  } finally {
    if (!ready) {
      destroyApplication(app);
    }
  }
}
