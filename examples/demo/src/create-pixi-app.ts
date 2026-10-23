import { Application, type WebGLRenderer } from 'pixi.js';

import { createExamplePlayer } from './create-example-player';
import { createStats } from './create-stats';
import type { PixiApp } from './types/pixi-app';
import { runCleanup } from './utils/run-cleanup';

/** Initialize one application; the returned player replaces effects within it. */
export async function createPixiApp(
  host: HTMLDivElement,
  signal: AbortSignal,
): Promise<PixiApp | undefined> {
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
