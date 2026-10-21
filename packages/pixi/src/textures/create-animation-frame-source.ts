import { BufferImageSource, type Texture } from 'pixi.js';

const TEXELS_PER_FRAME = 4;
const CHANNELS_PER_TEXEL = 4;
const VALUES_PER_FRAME = TEXELS_PER_FRAME * CHANNELS_PER_TEXEL;

/**
 * Create the vertex shader's animationFrames lookup texture, not the artwork itself.
 * Each animation frame occupies one row of four RGBA texels:
 *
 * 0: top-left and top-right atlas UVs
 * 1: bottom-left and bottom-right atlas UVs
 * 2: trim [x, y, width, height], normalized to the original frame dimensions
 * 3: original [width, height] in logical texture units, followed by two unused zeros
 *
 * Pixi's UVs already account for atlas rotation. The shader selects a row by frame
 * index and uses its trim and dimensions to build the particle quad.
 *
 * Frames are validated by resolveFlipbook before this call. Allocation happens on
 * animation selection; Pixi uploads the source on first binding. The emitter view
 * owns this source and destroys it on replacement or disposal. Artwork stays caller-owned.
 */
export function createAnimationFrameSource(
  frames: Texture[],
  maximumTextureHeight: number,
): BufferImageSource {
  if (frames.length > maximumTextureHeight) {
    throw new Error('Particle animation exceeds the GPU texture height limit');
  }

  const data = new Float32Array(frames.length * VALUES_PER_FRAME);

  for (const [frameIndex, frame] of frames.entries()) {
    const offset = frameIndex * VALUES_PER_FRAME;
    const { uvs, orig: original, trim } = frame;

    // The shader interpolates between these corners to sample the atlas artwork.
    data[offset] = uvs.x0;
    data[offset + 1] = uvs.y0;
    data[offset + 2] = uvs.x1;
    data[offset + 3] = uvs.y1;
    data[offset + 4] = uvs.x3;
    data[offset + 5] = uvs.y3;
    data[offset + 6] = uvs.x2;
    data[offset + 7] = uvs.y2;

    // Untrimmed frames occupy the full original rectangle: [0, 0, 1, 1].
    data[offset + 8] = trim ? trim.x / original.width : 0;
    data[offset + 9] = trim ? trim.y / original.height : 0;
    data[offset + 10] = trim ? trim.width / original.width : 1;
    data[offset + 11] = trim ? trim.height / original.height : 1;

    // Automatic sizing uses original dimensions; the final two channels stay zero.
    data[offset + 12] = original.width;
    data[offset + 13] = original.height;
  }

  // Preserve numeric values: no alpha premultiplication, interpolation, or mipmaps.
  return new BufferImageSource({
    label: 'particle animation frames',
    resource: data,
    width: TEXELS_PER_FRAME,
    height: frames.length,
    format: 'rgba32float',
    alphaMode: 'no-premultiply-alpha',
    scaleMode: 'nearest',
    addressMode: 'clamp-to-edge',
    autoGenerateMipmaps: false,
  });
}
