import { Application, type WebGLRenderer } from 'pixi.js';

import type { ExamplePlayer } from '../types/example-player';
import { runCleanup } from '../utils/run-cleanup';
import { createExamplePlayer } from './example-player';
import { createStats } from './stats';

/**
 * Initialize one application; the returned player replaces effects within it.
 * Destroying this player also releases the shared application, canvas, and stats.
 */
export async function createPixiApp(
  host: HTMLDivElement,
  signal: AbortSignal,
): Promise<ExamplePlayer | undefined> {
  const app = new Application<WebGLRenderer>();

  try {
    await app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      preference: 'webgl',
      preferWebGLVersion: 2,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      autoStart: false,
    });
  } catch (error) {
    destroyApplication(app);
    throw error;
  }

  if (signal.aborted) {
    destroyApplication(app);
    return undefined;
  }

  return mountApplication(app, host);
}

/** Mount shared resources in order and release them in reverse order. */
function mountApplication(app: Application<WebGLRenderer>, host: HTMLDivElement) {
  const cleanup: (() => void)[] = [() => destroyApplication(app)];
  let destroyed = false;

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    runCleanup(cleanup.reverse());
  }

  try {
    const stats = createStats(app, host);
    cleanup.push(() => stats.destroy());
    const player = createExamplePlayer(app, stats);
    cleanup.push(() => player.destroy());

    // The preview has no scene interactions; let touch gestures scroll and zoom the page.
    app.renderer.events.autoPreventDefault = false;
    app.canvas.style.touchAction = 'auto';
    host.appendChild(app.canvas);
    app.start();
    return { ...player, destroy };
  } catch (error) {
    destroy();
    throw error;
  }
}

/** Pixi can fail before a renderer exists; its stage still needs releasing. */
function destroyApplication(app: Application<WebGLRenderer>) {
  if (app.renderer) {
    app.destroy(true, { children: true });
  } else {
    app.stage.destroy({ children: true });
  }
}
