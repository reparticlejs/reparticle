import { Application } from 'pixi.js';

import type { ExamplePlayer } from '../types/example-player';
import type { PlayerBackend } from '../types/player-backend';
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
  backend: PlayerBackend = 'auto',
): Promise<ExamplePlayer | undefined> {
  const app = new Application();

  try {
    await app.init({
      resizeTo: host,
      // A single-entry preference prevents silent fallback during backend testing.
      ...(backend === 'auto'
        ? {}
        : { preference: [backend === 'webgl2' ? ('webgl' as const) : ('webgpu' as const)] }),
      backgroundAlpha: 0,
      // Let Pixi choose the backend; require WebGL2 if it selects WebGL.
      preferWebGLVersion: 2,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      autoStart: false,
    });
  } catch (error) {
    destroyApplication(app);
    if (
      backend === 'webgpu' &&
      error instanceof Error &&
      error.message === 'No available renderer for the current environment'
    ) {
      if (!window.isSecureContext) {
        throw new Error(
          'WebGPU requires HTTPS or localhost. Open this page using a secure address.',
          { cause: error },
        );
      }
      if (!navigator.gpu) {
        throw new Error('WebGPU is not available in this browser. Try WebGL2 or Auto.', {
          cause: error,
        });
      }
      throw new Error(
        'The browser could not create a WebGPU device. In Chrome, check graphics acceleration in Settings and WebGPU status at chrome://gpu. You can use WebGL2 or Auto.',
        { cause: error },
      );
    }
    throw error;
  }

  if (signal.aborted) {
    destroyApplication(app);
    return undefined;
  }

  return mountApplication(app, host);
}

/** Mount shared resources in order and release them in reverse order. */
function mountApplication(app: Application, host: HTMLDivElement) {
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
function destroyApplication(app: Application) {
  if (app.renderer) {
    app.destroy(true, { children: true });
  } else {
    app.stage.destroy({ children: true });
  }
}
