import { Graphics, TilingSprite, type WebGLRenderer } from 'pixi.js';

/** Render the checkerboard inside Pixi so particle blend modes see its colors. */
export function createBackground(renderer: WebGLRenderer): TilingSprite {
  const pattern = new Graphics()
    .rect(0, 0, 32, 32)
    .fill('#111111')
    .rect(0, 0, 16, 16)
    .rect(16, 16, 16, 16)
    .fill('#191919');
  const texture = renderer.generateTexture({ target: pattern, resolution: 1 });
  pattern.destroy();
  return new TilingSprite({ texture });
}
