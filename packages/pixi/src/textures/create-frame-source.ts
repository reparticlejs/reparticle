import { BufferImageSource, type Texture } from 'pixi.js';

/** Four RGBA texels per frame: UV corners, trim rectangle, original dimensions and two reserved channels. */
export function createFrameSource(frames: Texture[], maximumHeight: number): BufferImageSource {
  if (frames.length > maximumHeight) {
    throw new Error('Particle animation exceeds the GPU texture height limit');
  }
  const data = new Float32Array(frames.length * 16);
  for (const [index, frame] of frames.entries()) {
    const { uvs: uv, orig, trim } = frame;
    data.set(
      [
        uv.x0,
        uv.y0,
        uv.x1,
        uv.y1,
        uv.x3,
        uv.y3,
        uv.x2,
        uv.y2,
        trim ? trim.x / orig.width : 0,
        trim ? trim.y / orig.height : 0,
        trim ? trim.width / orig.width : 1,
        trim ? trim.height / orig.height : 1,
        orig.width,
        orig.height,
        0,
        0,
      ],
      index * 16,
    );
  }
  // Numeric frame metadata, not artwork: preserve float values and sample texels
  // exactly. Pixi allocates and uploads this source on first texture binding.
  return new BufferImageSource({
    label: 'particle animation frames',
    resource: data,
    width: 4,
    height: frames.length,
    format: 'rgba32float',
    alphaMode: 'no-premultiply-alpha',
    scaleMode: 'nearest',
    addressMode: 'clamp-to-edge',
    autoGenerateMipmaps: false,
  });
}
