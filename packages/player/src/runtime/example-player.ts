import type { Application } from 'pixi.js';

import type { Example } from '../types/example';
import type { ExamplePlayer } from '../types/example-player';
import type { ExampleUpdate } from '../types/example-update';
import type { MountedExample } from '../types/mounted-example';
import type { Stats } from '../types/stats';
import { loadArtwork } from './artwork';
import { loadExample } from './example';

/** Own one selection at a time. The application and stats belong to the caller. */
export function createExamplePlayer(app: Application, stats: Stats): ExamplePlayer {
  let activeExample: MountedExample | undefined;
  let pendingLoad: AbortController | undefined;
  let destroyed = false;
  let updateRevision = 0;

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
      stats.setEffect(next.effect);
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

  /** Resolve borrowed artwork before mutation; a newer edit or selection cancels it. */
  async function update(example: Example, change: ExampleUpdate): Promise<boolean> {
    const current = activeExample;
    if (!current || destroyed || pendingLoad) {
      return false;
    }
    const revision = ++updateRevision;
    let artwork: Awaited<ReturnType<typeof loadArtwork>> | undefined;
    try {
      artwork = change.artwork ? await loadArtwork(example) : undefined;
    } catch (error) {
      if (revision !== updateRevision || current !== activeExample || destroyed) {
        return false;
      }
      throw error;
    }
    if (revision !== updateRevision || current !== activeExample || destroyed) {
      return false;
    }
    const effect = current.effect;
    if (change.parameters) {
      effect.getEmitter(change.emitterId).setParameters(change.parameters);
    }
    if (change.rendering) {
      effect.setEmitterBlendMode(change.emitterId, change.rendering.blendMode);
      effect.setEmitterTint(
        change.emitterId,
        change.rendering.tint ?? {
          red: 1,
          green: 1,
          blue: 1,
          alpha: 1,
        },
      );
    }
    if (artwork) {
      effect.setEmitterTexture(change.emitterId, artwork[change.emitterId]!);
    }
    return true;
  }

  function setPaused(paused: boolean) {
    if (activeExample) {
      activeExample.effect.autoUpdate = !paused;
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
    updateRevision++;
    pendingLoad?.abort();
    pendingLoad = undefined;
    stats.setEffect(undefined);

    const previous = activeExample;
    activeExample = undefined;
    previous?.destroy();
  }

  return { select, update, setPaused, restart, destroy };
}
