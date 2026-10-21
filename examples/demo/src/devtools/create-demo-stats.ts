import type { ParticleEffect } from '@reparticle/pixi';
import type { Application, WebGLRenderer } from 'pixi.js';

import { createStats } from './index';

/** Compact overlay using the existing CPU particle order, without GPU readbacks. */
export function createDemoStats(
  app: Application<WebGLRenderer>,
  host: HTMLElement,
  effect: ParticleEffect,
) {
  const emitters = [...effect.emitters.values()];
  const order = new Uint32Array(Math.max(...emitters.map((emitter) => emitter.capacity)));

  return createStats({
    container: host,
    display: 'compact',
    gl: app.renderer.gl,
    getParticleCount() {
      let count = 0;
      for (const emitter of emitters) {
        count += emitter.copyParticleOrder(order);
      }
      return count;
    },
    subscribePostRender(listener) {
      const callback = () => listener(app.ticker.lastTime);
      app.ticker.add(callback, undefined, -100);
      return () => app.ticker.remove(callback);
    },
  });
}
