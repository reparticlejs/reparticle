import { BufferImageSource, Texture } from 'pixi.js';

const TEXTURE_SIZE = 32;
const CHANNELS_PER_PIXEL = 4;
let sharedTexture: Texture | undefined;

/**
 * Return the shared placeholder for missing artwork: a green border and diagonal on black.
 * Created lazily, uploaded by Pixi on first use, and borrowed by effects without ownership.
 * Recreate it if a consumer has destroyed the texture or its source.
 */
export function getMissingTexture(): Texture {
  if (!sharedTexture || sharedTexture.destroyed || sharedTexture.source.destroyed) {
    sharedTexture = createMissingTexture();
  }
  return sharedTexture;
}

/** A buffer source avoids image loading and works without a DOM canvas. */
function createMissingTexture(): Texture {
  const source = new BufferImageSource({
    label: 'missing particle artwork',
    resource: createPixels(),
    width: TEXTURE_SIZE,
    height: TEXTURE_SIZE,
    format: 'rgba8unorm',
    scaleMode: 'nearest',
    autoGenerateMipmaps: false,
  });
  return new Texture({ source });
}

/** Opaque RGBA pixels. Red and blue remain zero; only the green channel draws the pattern. */
function createPixels(): Uint8Array {
  const pixels = new Uint8Array(TEXTURE_SIZE * TEXTURE_SIZE * CHANNELS_PER_PIXEL);
  const lastPixel = TEXTURE_SIZE - 1;

  for (let y = 0; y < TEXTURE_SIZE; y++) {
    for (let x = 0; x < TEXTURE_SIZE; x++) {
      const offset = (y * TEXTURE_SIZE + x) * CHANNELS_PER_PIXEL;
      const isBorder = x === 0 || y === 0 || x === lastPixel || y === lastPixel;
      const isDiagonal = x === y;

      pixels[offset + 1] = isBorder || isDiagonal ? 255 : 0; // Green
      pixels[offset + 3] = 255; // Alpha
    }
  }
  return pixels;
}
