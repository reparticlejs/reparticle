import type { Application } from 'pixi.js';

/** Initialization can fail before Pixi has created a renderer. */
export function destroyApplication(app: Application): void {
  if (app.renderer) {
    app.destroy(true, { children: true });
  } else {
    app.stage.destroy({ children: true });
  }
}
