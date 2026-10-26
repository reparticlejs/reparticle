import { expect, it, vi } from 'vitest';

import { acquireProgram, releaseProgram } from '#src/runtime/gpu/program.js';

/** WebGL ownership tests; real shader execution is checked by the browser parity suite. */
function context() {
  const Context = vi.fn<typeof WebGL2RenderingContext>();
  const Program = vi.fn<typeof WebGLProgram>();
  const Shader = vi.fn<typeof WebGLShader>();
  const gl = new Context();
  const live = new Set<WebGLProgram>();
  const isContextLost = vi.fn<WebGL2RenderingContext['isContextLost']>(() => false);
  const createProgram = vi.fn<WebGL2RenderingContext['createProgram']>(() => {
    const program = new Program();
    live.add(program);
    return program;
  });
  const isProgram = vi.fn<WebGL2RenderingContext['isProgram']>(
    (program) => program !== null && live.has(program),
  );
  const deleteProgram = vi.fn<WebGL2RenderingContext['deleteProgram']>((program) => {
    if (program) {
      live.delete(program);
    }
  });
  const createShader = vi.fn<WebGL2RenderingContext['createShader']>(() => new Shader());
  const shaderSource = vi.fn<WebGL2RenderingContext['shaderSource']>();
  const compileShader = vi.fn<WebGL2RenderingContext['compileShader']>();
  const getShaderParameter = vi.fn<WebGL2RenderingContext['getShaderParameter']>(() => true);
  const attachShader = vi.fn<WebGL2RenderingContext['attachShader']>();
  const deleteShader = vi.fn<WebGL2RenderingContext['deleteShader']>();
  const linkProgram = vi.fn<WebGL2RenderingContext['linkProgram']>();
  const getProgramParameter = vi.fn<WebGL2RenderingContext['getProgramParameter']>(() => true);
  const getUniformLocation = vi.fn<WebGL2RenderingContext['getUniformLocation']>(() => null);
  const getUniformBlockIndex = vi.fn<WebGL2RenderingContext['getUniformBlockIndex']>(() => 0);
  const uniformBlockBinding = vi.fn<WebGL2RenderingContext['uniformBlockBinding']>();
  const mocks = {
    isContextLost,
    createProgram,
    isProgram,
    deleteProgram,
    createShader,
    shaderSource,
    compileShader,
    getShaderParameter,
    attachShader,
    deleteShader,
    linkProgram,
    getProgramParameter,
    getUniformLocation,
    getUniformBlockIndex,
    uniformBlockBinding,
  };
  Object.assign(gl, mocks);
  return { gl, live, mocks };
}

it('shares a program within one context and deletes it only after the last owner', () => {
  const { gl, mocks } = context();
  const first = acquireProgram(gl);
  const second = acquireProgram(gl);
  expect(first).toBe(second);
  expect(mocks.createProgram).toHaveBeenCalledTimes(1);
  releaseProgram(gl, first);
  expect(mocks.deleteProgram).not.toHaveBeenCalled();
  releaseProgram(gl, second);
  expect(mocks.deleteProgram).toHaveBeenCalledExactlyOnceWith(first.program);
  const next = acquireProgram(gl);
  expect(next.program).not.toBe(first.program);
  releaseProgram(gl, next);
});

it('does not share programs across contexts', () => {
  const a = context(),
    b = context();
  const first = acquireProgram(a.gl),
    second = acquireProgram(b.gl);
  expect(first.program).not.toBe(second.program);
  releaseProgram(a.gl, first);
  expect(b.gl.isProgram(second.program)).toBe(true);
  releaseProgram(b.gl, second);
});

it('does not let a stale owner delete the restored context program', () => {
  const { gl, live } = context();
  const stale = acquireProgram(gl);
  live.clear(); // Context loss invalidates all old handles.
  const restored = acquireProgram(gl);
  releaseProgram(gl, stale);
  expect(gl.isProgram(restored.program)).toBe(true);
  expect(acquireProgram(gl)).toBe(restored);
  releaseProgram(gl, restored);
  releaseProgram(gl, restored);
});

it('cleans up failed shader allocation and allows a later retry', () => {
  const { gl, mocks } = context();
  mocks.createShader.mockReturnValueOnce(null);
  expect(() => acquireProgram(gl)).toThrow('Shader allocation failed');
  expect(mocks.deleteProgram).toHaveBeenCalledTimes(1);
  const retry = acquireProgram(gl);
  expect(gl.isProgram(retry.program)).toBe(true);
  releaseProgram(gl, retry);
});
