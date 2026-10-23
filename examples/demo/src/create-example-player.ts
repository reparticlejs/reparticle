import type { Application, WebGLRenderer } from 'pixi.js';

import { loadExample } from './load-example';
import type { Example } from './types/example';
import type { ExamplePlayer, LoadedExample } from './types/example-player';
import type { Stats } from './types/stats';

/** Own one selection at a time. The application and stats belong to the caller. */
export function createExamplePlayer(app: Application<WebGLRenderer>, stats: Stats): ExamplePlayer {
  let activeExample: LoadedExample | undefined;
  let pendingLoad: AbortController | undefined;
  let destroyed = false;

  /** Only the latest uncancelled request may become the active example. */
  async function select(example: Example): Promise<boolean> {
    if (destroyed) {
      return false;
    }
    releaseSelection();

    const request = new AbortController();
    pendingLoad = request;
    try {
      const next = await loadExample(app, example, request.signal);
      if (request.signal.aborted) {
        next?.destroy();
        return false;
      }
      if (!next) {
        return false;
      }
      activeExample = next;
      stats.setEffect(next.particles);
      return true;
    } catch (error) {
      if (request.signal.aborted) {
        return false;
      }
      throw error;
    } finally {
      // An older request must not clear the newer request's cancellation handle.
      if (pendingLoad === request) {
        pendingLoad = undefined;
      }
    }
  }

  function setPaused(paused: boolean) {
    if (activeExample) {
      activeExample.particles.autoUpdate = !paused;
    }
  }

  function restart() {
    activeExample?.restart();
  }

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    releaseSelection();
  }

  /** Detach ownership before destruction, so cleanup cannot leave a stale effect. */
  function releaseSelection() {
    pendingLoad?.abort();
    pendingLoad = undefined;
    stats.setEffect(undefined);

    const previous = activeExample;
    activeExample = undefined;
    previous?.destroy();
  }

  return { select, setPaused, restart, destroy };
}
