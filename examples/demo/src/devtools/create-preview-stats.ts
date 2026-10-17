import type { Application, WebGLRenderer } from 'pixi.js';

import type { PreviewControls } from '../types/preview';
import { createStats } from './index';
import { PreviewParticleCount } from './stats/measurement/preview-particle-count';

/** All preview-only counting and stats instrumentation stays in devtools. */
export function createPreviewStats(
  app: Application<WebGLRenderer>,
  host: HTMLDivElement,
  capacity: number,
) {
  const renderer = app.renderer;
  let particles = new PreviewParticleCount(capacity);
  const overlay = createStats({
    container: host,
    display: 'compact',
    getParticleCount: () => particles.count,
    gl: renderer.gl,
    subscribePostRender(listener) {
      const callback = () => listener(app.ticker.lastTime);
      app.ticker.add(callback, undefined, -100);
      return () => app.ticker.remove(callback);
    },
  });

  return {
    advance(seconds: number, controls: PreviewControls, emitting: boolean) {
      particles.advance(seconds, controls, emitting);
    },
    reset(nextCapacity: number) {
      particles = new PreviewParticleCount(nextCapacity);
    },
    setVisible(visible: boolean) {
      if (visible) {
        overlay.show();
      } else {
        overlay.hide();
      }
    },
    destroy() {
      overlay.destroy();
    },
  };
}
