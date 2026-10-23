import { Application, type TilingSprite, type WebGLRenderer } from 'pixi.js';

import { createBackground } from './create-background';
import { createStats } from './create-stats';
import { loadExample } from './load-example';
import type { Example } from './types/example';

/** Own the canvas and renderer once; selections replace only the mounted effect. */
export async function createPixiApp(host: HTMLDivElement, signal: AbortSignal) {
  const app = new Application<WebGLRenderer>();
  let mounted = false;
  let disposed = false;
  let stats: ReturnType<typeof createStats> | undefined;
  let background: TilingSprite | undefined;
  let current: Awaited<ReturnType<typeof loadExample>>;
  let loading: AbortController | undefined;

  function destroy() {
    if (disposed) {
      return;
    }
    disposed = true;
    loading?.abort();
    stats?.destroy();
    current?.destroy();
    background?.destroy({ texture: true, textureSource: true });
    if (app.renderer) {
      app.destroy(true, { children: true });
    } else {
      app.stage.destroy({ children: true });
    }
  }

  async function select(example: Example): Promise<boolean> {
    if (disposed) {
      return false;
    }
    loading?.abort();
    const request = new AbortController();
    loading = request;
    stats?.setEffect(undefined);
    current?.destroy();
    current = undefined;

    try {
      const next = await loadExample(app, example, request.signal);
      if (request.signal.aborted) {
        next?.destroy();
        return false;
      }
      current = next;
      stats?.setEffect(next?.particles);
      return next !== undefined;
    } catch (error) {
      if (request.signal.aborted) {
        return false;
      }
      throw error;
    }
  }

  try {
    await app.init({
      resizeTo: host,
      background: '#111111',
      preference: 'webgl',
      preferWebGLVersion: 2,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      autoStart: false,
    });
    if (signal.aborted) {
      return undefined;
    }

    const checkerboard = createBackground(app.renderer);
    background = checkerboard;
    app.stage.addChild(checkerboard);
    function resizeBackground() {
      checkerboard.width = app.screen.width;
      checkerboard.height = app.screen.height;
    }
    app.renderer.on('resize', resizeBackground);
    resizeBackground();
    host.appendChild(app.canvas);
    stats = createStats(app, host);
    app.start();
    mounted = true;

    return {
      destroy,
      select,
      setPaused(paused: boolean) {
        if (current) {
          current.particles.autoUpdate = !paused;
        }
      },
      restart() {
        current?.restart();
      },
    };
  } finally {
    if (!mounted) {
      destroy();
    }
  }
}
