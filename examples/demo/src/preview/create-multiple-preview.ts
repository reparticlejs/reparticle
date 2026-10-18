import { ParticleView } from '@reparticle/pixi';
import { Application, Assets, type Spritesheet, type WebGLRenderer } from 'pixi.js';

import { destroyApplication } from './destroy-application';

/** Small composed-effect example, independent of the single-emitter controls. */
export async function createMultiplePreview(host: HTMLDivElement, signal: AbortSignal) {
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
    const view = new ParticleView(app.renderer, effect, {
      emitters: {
        smoke: { texture: null },
        fire: { texture: null },
        sparks: { atlas, frame: 'spark' },
      },
    });
    app.stage.addChild(view);
    for (const emitter of view.emitters.values()) {
      emitter.x = app.screen.width / 2;
      emitter.y = app.screen.height * 0.7;
    }
    app.ticker.add(({ deltaMS }) => view.update(Math.min(deltaMS / 1000, 0.05)));
    host.appendChild(app.canvas);
    app.start();
    ready = true;
    return {
      reset: () => view.reset(),
      pause: (paused: boolean) => (paused ? app.stop() : app.start()),
      destroy: () => destroyApplication(app),
    };
  } finally {
    if (!ready) {
      destroyApplication(app);
    }
  }
}
