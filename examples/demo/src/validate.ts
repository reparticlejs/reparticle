import type { Application, WebGLRenderer } from "pixi.js";
import type { ParticleView } from "@reparticle/pixi";

/** Explicit diagnostic: readback happens only after the measured playback interval. */
export function validateGPU(app: Application, view: ParticleView): object {
  const renderer = app.renderer as WebGLRenderer;
  const gl = renderer.gl as WebGL2RenderingContext;
  const emitter = view.emitter;
  const saved = {
    options: emitter.options,
    x: emitter.x,
    y: emitter.y,
    emitting: emitter.emitting,
  };
  const counters: Record<string, number> = {};
  const names = [
    "readPixels",
    "getBufferSubData",
    "texImage2D",
    "texSubImage2D",
    "createTexture",
    "bufferData",
    "bufferSubData",
  ] as const;
  const restore: (() => void)[] = [];
  const readFirst = () => {
    const fbo = gl.createFramebuffer();
    const values = new Float32Array(8);
    try {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        emitter.texture,
        0,
      );
      if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE)
        throw new Error("Validation framebuffer incomplete");
      gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.FLOAT, values.subarray(0, 4));
      gl.readPixels(0, emitter.rows, 1, 1, gl.RGBA, gl.FLOAT, values.subarray(4, 8));
      return Array.from(values);
    } finally {
      gl.deleteFramebuffer(fbo);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      renderer.resetState();
    }
  };
  try {
    emitter.setOptions({ rate: 120, lifetime: 2, speed: 0, gravity: 100 });
    emitter.x = 0;
    emitter.y = 0;
    emitter.emitting = true;
    view.reset();
    // Warm Pixi resources before instrumentation.
    app.render();
    for (const name of names) {
      const original = gl[name];
      counters[name] = 0;
      const wrapped = (...args: unknown[]) => {
        counters[name]!++;
        return Reflect.apply(original, gl, args);
      };
      Object.defineProperty(gl, name, { configurable: true, writable: true, value: wrapped });
      restore.push(() =>
        Object.defineProperty(gl, name, { configurable: true, writable: true, value: original }),
      );
    }
    for (let i = 0; i < 120; i++) {
      view.update(1 / 120);
      app.render();
    }
    for (const fn of restore) fn();
    restore.length = 0;
    const state = readFirst();
    const age = 119 / 120;
    const expected = [0, 50 * age * age, 0, 100 * age, age, 2, 1, 0];
    const maxError = Math.max(...state.map((value, i) => Math.abs(value - expected[i]!)));
    const residencyPass = Object.values(counters).every((value) => value === 0);
    view.reset();
    const resetPass = readFirst().every((value) => value === 0);
    emitter.setOptions({ rate: 10, lifetime: 0.05 });
    view.update(0.1);
    emitter.emitting = false;
    view.update(0.1);
    const expired = readFirst();
    const expirationPass = expired[4]! >= expired[5]!;
    const glError = gl.getError();
    return {
      pass: residencyPass && maxError < 0.02 && resetPass && expirationPass && glError === 0,
      backend: "GPU.js 2.24.1 / WebGL2",
      capacity: emitter.capacity,
      frames: 120,
      counters,
      maxError,
      resetPass,
      expirationPass,
      glError,
      note: "Six explicit texel reads after measurement validate integration, reset and expiration. No playback readbacks.",
    };
  } finally {
    for (const fn of restore) fn();
    emitter.setOptions(saved.options);
    emitter.x = saved.x;
    emitter.y = saved.y;
    emitter.emitting = saved.emitting;
    view.reset();
  }
}
