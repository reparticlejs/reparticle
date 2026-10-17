import type { Application, WebGLRenderer } from 'pixi.js';

import type { createPreviewStats } from '../devtools/create-preview-stats';

export interface PreviewHost {
  initialize(app: Application<WebGLRenderer>): Promise<void>;
  createStats(
    app: Application<WebGLRenderer>,
    capacity: number,
  ): ReturnType<typeof createPreviewStats>;
  appendCanvas(canvas: HTMLCanvasElement): void;
  getBounds(): { left: number; top: number; width: number; height: number };
}
