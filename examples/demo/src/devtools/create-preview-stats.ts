import type { Application, WebGLRenderer } from 'pixi.js';

import type { PreviewControls } from '../types/preview';
import { createStats } from './index';
import { LiveParticleCount } from './stats/measurement/live-particle-count';

/** All preview-only counting and stats instrumentation stays in devtools. */
export function createPreviewStats(app: Application, host: HTMLDivElement, capacity: number) {
  let particles = new LiveParticleCount(capacity);
  const overlay = createStats({
    container: host,
    display: 'compact',
    getParticleCount: () => particles.count,
    gl: (app.renderer as WebGLRenderer).gl,
    subscribePostRender(listener) {
      const callback = () => listener(app.ticker.lastTime);
      app.ticker.add(callback, undefined, -100);
      return () => app.ticker.remove(callback);
    },
  });

  return {
    advance(seconds: number, controls: PreviewControls, emitting: boolean) {
      particles.advance(seconds, emitting ? controls.rate : 0, controls.lifetime);
    },
    reset(nextCapacity: number) {
      particles = new LiveParticleCount(nextCapacity);
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
