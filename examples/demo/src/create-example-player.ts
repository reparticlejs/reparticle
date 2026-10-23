import type { Application, WebGLRenderer } from 'pixi.js';

import type { createStats } from './create-stats';
import { loadExample } from './load-example';
import type { Example } from './types/example';

/** Own the selected effect and cancel superseded loads without replacing the application. */
export function createExamplePlayer(
  app: Application<WebGLRenderer>,
  stats: ReturnType<typeof createStats>,
) {
  let current: Awaited<ReturnType<typeof loadExample>>;
  let loading: AbortController | undefined;
  let destroyed = false;

  function clear() {
    loading?.abort();
    loading = undefined;
    stats.setEffect(undefined);
    const previous = current;
    current = undefined;
    previous?.destroy();
  }

  async function select(example: Example): Promise<boolean> {
    if (destroyed) {
      return false;
    }
    clear();

    const request = new AbortController();
    loading = request;
    try {
      const next = await loadExample(app, example, request.signal);
      if (request.signal.aborted) {
        next?.destroy();
        return false;
      }
      current = next;
      stats.setEffect(next?.particles);
      return next !== undefined;
    } catch (error) {
      if (request.signal.aborted) {
        return false;
      }
      throw error;
    } finally {
      // An older request must not clear the newer request's cancellation handle.
      if (loading === request) {
        loading = undefined;
      }
    }
  }

  return {
    select,
    setPaused(paused: boolean) {
      if (current) {
        current.particles.autoUpdate = !paused;
      }
    },
    restart() {
      current?.restart();
    },
    destroy() {
      if (destroyed) {
        return;
      }
      destroyed = true;
      clear();
    },
  };
}
