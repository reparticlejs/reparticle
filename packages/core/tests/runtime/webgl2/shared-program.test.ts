import { expect, it, vi } from 'vitest';

import {
  acquireSimulationProgram,
  releaseSimulationProgram,
} from '#runtime/webgl2/shared-program.js';

/** WebGL ownership tests; real shader execution is checked by the browser integration suite. */
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
  const first = acquireSimulationProgram(gl);
  const second = acquireSimulationProgram(gl);
  expect(first).toBe(second);
  expect(mocks.createProgram).toHaveBeenCalledTimes(1);
  releaseSimulationProgram(gl, first);
  expect(mocks.deleteProgram).not.toHaveBeenCalled();
  releaseSimulationProgram(gl, second);
  expect(mocks.deleteProgram).toHaveBeenCalledExactlyOnceWith(first.program);
  const next = acquireSimulationProgram(gl);
  expect(next.program).not.toBe(first.program);
  releaseSimulationProgram(gl, next);
});

it('does not share programs across contexts', () => {
  const a = context(),
    b = context();
  const first = acquireSimulationProgram(a.gl),
    second = acquireSimulationProgram(b.gl);
  expect(first.program).not.toBe(second.program);
  releaseSimulationProgram(a.gl, first);
  expect(b.gl.isProgram(second.program)).toBe(true);
  releaseSimulationProgram(b.gl, second);
});

it('does not let a stale owner delete the restored context program', () => {
  const { gl, live } = context();
  const stale = acquireSimulationProgram(gl);
  live.clear(); // Context loss invalidates all old handles.
  const restored = acquireSimulationProgram(gl);
  releaseSimulationProgram(gl, stale);
  expect(gl.isProgram(restored.program)).toBe(true);
  expect(acquireSimulationProgram(gl)).toBe(restored);
  releaseSimulationProgram(gl, restored);
  releaseSimulationProgram(gl, restored);
});

it('cleans up failed shader allocation and allows a later retry', () => {
  const { gl, mocks } = context();
  mocks.createShader.mockReturnValueOnce(null);
  expect(() => acquireSimulationProgram(gl)).toThrow('Shader allocation failed');
  expect(mocks.deleteProgram).toHaveBeenCalledTimes(1);
  const retry = acquireSimulationProgram(gl);
  expect(gl.isProgram(retry.program)).toBe(true);
  releaseSimulationProgram(gl, retry);
});

it('looks up only active standalone uniforms; other inputs use the uniform block', () => {
  const { gl, mocks } = context();
  const shared = acquireSimulationProgram(gl);
  expect(mocks.getUniformLocation.mock.calls.map(([, name]) => name)).toEqual([
    'user_state',
    'user_spawnMask',
    'birthPass',
    'birthState',
    'constants_width',
    'constants_rows',
    'constants_capacity',
  ]);
  releaseSimulationProgram(gl, shared);
});

it('cleans up shader compilation failures before allowing a retry', () => {
  const { gl, mocks } = context();
  gl.getShaderInfoLog = vi.fn<WebGL2RenderingContext['getShaderInfoLog']>(() => 'Invalid shader');
  mocks.getShaderParameter.mockReturnValueOnce(false);
  expect(() => acquireSimulationProgram(gl)).toThrow('Invalid shader');
  expect(mocks.deleteShader).toHaveBeenCalledTimes(1);
  expect(mocks.deleteProgram).toHaveBeenCalledTimes(1);
  const retry = acquireSimulationProgram(gl);
  expect(retry.users).toBe(1);
  releaseSimulationProgram(gl, retry);
});

it('cleans up both shaders and the program when linking fails', () => {
  const { gl, mocks } = context();
  gl.getProgramInfoLog = vi.fn<WebGL2RenderingContext['getProgramInfoLog']>(() => 'Cannot link');
  mocks.getProgramParameter.mockReturnValueOnce(false);
  expect(() => acquireSimulationProgram(gl)).toThrow('Cannot link');
  expect(mocks.deleteShader).toHaveBeenCalledTimes(2);
  expect(mocks.deleteProgram).toHaveBeenCalledTimes(1);
  const retry = acquireSimulationProgram(gl);
  expect(retry.users).toBe(1);
  releaseSimulationProgram(gl, retry);
});
