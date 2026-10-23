import type { ParticleEffect } from '@reparticle/pixi';
import { type Application, type Ticker, UPDATE_PRIORITY, type WebGLRenderer } from 'pixi.js';

import type { Example } from './types/example';

/** Move the display object before simulation; world-space particles leave a trail. */
export function animateEmitter(
  app: Application<WebGLRenderer>,
  effect: ParticleEffect,
  motion: NonNullable<Example['motion']>,
) {
  let elapsed = 0;

  function position() {
    const duration = motion === 'pendulum' ? 5.2 : 6;
    const angle = (elapsed / duration) * Math.PI * 2;
    const width = app.screen.width;
    const height = app.screen.height;
    const x = Math.sin(angle) * width * 0.3;
    const y =
      motion === 'pendulum'
        ? Math.cos(angle * 2) * height * 0.12
        : Math.sin(angle * 2) * height * 0.18;
    effect.position.set(width / 2 + x, height / 2 + y);
  }

  function update(ticker: Ticker) {
    if (!effect.autoUpdate) {
      return;
    }
    elapsed += ticker.deltaMS / 1000;
    position();
  }

  app.ticker.add(update, undefined, UPDATE_PRIORITY.HIGH);

  position();
  return {
    restart() {
      elapsed = 0;
      position();
    },
    destroy() {
      app.ticker.remove(update);
    },
  };
}
