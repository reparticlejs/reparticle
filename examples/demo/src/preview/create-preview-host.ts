import { createPreviewStats } from '../devtools/create-preview-stats';
import type { PreviewHost } from '../types/preview-host';

/** Browser integration for the preview lifecycle. */
export function createPreviewHost(element: HTMLDivElement): PreviewHost {
  return {
    initialize(app) {
      return app.init({
        resizeTo: element,
        background: '#0a111c',
        antialias: false,
        preference: 'webgl',
        preferWebGLVersion: 2,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
    },
    createStats: (app, capacity) => createPreviewStats(app, element, capacity),
    appendCanvas: (canvas) => {
      element.appendChild(canvas);
    },
    getBounds: () => element.getBoundingClientRect(),
  };
}
