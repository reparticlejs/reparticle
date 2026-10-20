import type { EmitterConfig } from '@reparticle/core';

/** Blend factors for premultiplied particle colors. */
export function setBlendMode(gl: WebGL2RenderingContext, mode: EmitterConfig['blendMode']): void {
  switch (mode) {
    case 'alpha':
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      break;
    case 'add':
      gl.blendFunc(gl.ONE, gl.ONE);
      break;
    case 'multiply':
      gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
      break;
    case 'screen':
      gl.blendFunc(gl.ONE_MINUS_DST_COLOR, gl.ONE);
      break;
  }
}
