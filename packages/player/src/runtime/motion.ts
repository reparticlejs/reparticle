import type { ParticleEffect } from '@reparticle/pixi';
import { type Application, type Ticker, UPDATE_PRIORITY } from 'pixi.js';

import type { Example } from '../types/example';

const FULL_TURN = Math.PI * 2;
const HORIZONTAL_REACH = 0.3;

/**
 * Move the entire effect along a repeating path centered in the canvas.
 * Update before particle simulation so world-space particles leave a trail.
 * Pausing the effect also freezes the path; this helper does not own the effect.
 */
export function animateEffect(
  app: Application,
  effect: ParticleEffect,
  motion: NonNullable<Example['motion']>,
) {
  const isPendulum = motion === 'pendulum';
  const cycleSeconds = isPendulum ? 5.2 : 6;
  const verticalReach = isPendulum ? 0.12 : 0.18;
  let elapsedSeconds = 0;

  function updatePosition() {
    const { width, height } = app.screen;
    const phase = (elapsedSeconds / cycleSeconds) * FULL_TURN;
    const horizontalWave = Math.sin(phase);

    // Two vertical cycles per horizontal cycle create the crossing figure-eight.
    // Cosine shifts that path into a symmetric swinging arc for the pendulum.
    const verticalWave = isPendulum ? Math.cos(phase * 2) : Math.sin(phase * 2);
    const offsetX = horizontalWave * width * HORIZONTAL_REACH;
    const offsetY = verticalWave * height * verticalReach;
    effect.position.set(width / 2 + offsetX, height / 2 + offsetY);
  }

  function update(ticker: Ticker) {
    if (!effect.autoUpdate) {
      return;
    }
    elapsedSeconds += ticker.deltaMS / 1000;
    updatePosition();
  }

  /** Rewind only the movement; the caller separately resets the particles. */
  function restart() {
    elapsedSeconds = 0;
    updatePosition();
  }

  /** Remove the callback when switching examples; leave the shared ticker running. */
  function destroy() {
    app.ticker.remove(update);
  }

  updatePosition();
  app.ticker.add(update, undefined, UPDATE_PRIORITY.HIGH);
  return { restart, destroy };
}
