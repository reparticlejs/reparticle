import type { Texture } from 'pixi.js';

/** Four RGBA texels per frame: UV corners, trim rectangle, original aspect. */
export function createFrameTexture(gl: WebGL2RenderingContext, frames: Texture[]): WebGLTexture {
  if (frames.length > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
    throw new Error('Particle animation exceeds the GPU texture height limit');
  }
  const data = new Float32Array(frames.length * 16);
  for (const [index, frame] of frames.entries()) {
    const { uvs: uv, orig, trim } = frame;
    const longest = Math.max(orig.width, orig.height);
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
        orig.width / longest,
        orig.height / longest,
        0,
        0,
      ],
      index * 16,
    );
  }
  const texture = gl.createTexture();
  if (!texture) {
    throw new Error('Unable to create particle animation frame texture');
  }
  gl.activeTexture(gl.TEXTURE2);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 4, frames.length, 0, gl.RGBA, gl.FLOAT, data);
  return texture;
}
