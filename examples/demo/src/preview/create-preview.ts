import { Application, type WebGLRenderer } from 'pixi.js';

import type { ParticlePreview, PreviewControls } from '../types/preview';
import type { PreviewHost } from '../types/preview-host';
import { runCleanup } from '../utils/run-cleanup';
import { destroyApplication } from './destroy-application';
import { loadPreviewAssets } from './load-preview-assets';
import { PreviewScene } from './preview-scene';

/** Connects the scene, ticker, and debug overlay to a mounted canvas host. */
export async function createPreview(
  host: PreviewHost,
  signal: AbortSignal,
): Promise<ParticlePreview | null> {
  const app = new Application<WebGLRenderer>();
  let scene: PreviewScene | undefined;
  let stats: ReturnType<PreviewHost['createStats']> | undefined;
  let mounted = false;
  let destroyed = false;

  function destroy() {
    if (destroyed) {
      return;
    }
    destroyed = true;
    runCleanup([() => stats?.destroy(), () => scene?.destroy(), () => destroyApplication(app)]);
  }

  try {
    await host.initialize(app);

    if (signal.aborted) {
      return null;
    }

    const assets = await loadPreviewAssets(signal);

    if (!assets) {
      return null;
    }

    const activeScene = new PreviewScene(app, host, assets);
    scene = activeScene;
    const debug = host.createStats(app, activeScene.controls.capacity);
    stats = debug;

    function advance(elapsedSeconds: number) {
      const controls = activeScene.controls;
      if (controls.paused) {
        return;
      }
      activeScene.advance(elapsedSeconds);
      debug.advance(elapsedSeconds, controls, activeScene.emitting);
    }

    app.ticker.add(({ deltaMS }) => advance(deltaMS / 1000));
    host.appendCanvas(app.canvas);
    mounted = true;

    function setControls(patch: Partial<PreviewControls>): PreviewControls {
      const current = activeScene.controls;
      const capacityChanged = patch.capacity !== undefined && patch.capacity !== current.capacity;
      const shapeChanged = patch.shape !== undefined && patch.shape !== current.shape;
      const rebuilding = capacityChanged || shapeChanged;
      if (rebuilding) {
        debug.setVisible(false);
      }
      try {
        const controls = activeScene.setControls(patch);
        if (rebuilding) {
          debug.reset(controls.capacity);
        }
        return controls;
      } finally {
        debug.setVisible(activeScene.controls.statsVisible);
      }
    }

    function reset() {
      activeScene.reset();
      debug.reset(activeScene.controls.capacity);
    }

    return {
      get controls() {
        return { ...activeScene.controls };
      },
      setControls,
      movePointer: (x, y) => activeScene.movePointer(x, y),
      reset,
      destroy,
    };
  } finally {
    if (!mounted) {
      destroy();
    }
  }
}
