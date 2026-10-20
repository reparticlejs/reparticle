import type { IKernelRunShortcut, KernelVariable } from 'gpu.js';

import type { EmitterContext, PipelineTexture } from '#types/emitter.js';
import type { SimulationParameters } from '#types/simulation.js';

import { createKernels } from './create-kernels';
import { SimulationInputs } from './inputs';
import { isPipelineTexture } from './is-pipeline-texture';

// Order returned by createKernels(). Each update kernel owns a reusable texture.
const INITIALIZE_KERNEL = 0;
const UPDATE_KERNEL_A = 1;
const UPDATE_KERNEL_B = 2;
const PARTICLE_BANDS = 5;
const NO_ARGUMENTS: KernelVariable[] = [];

/**
 * Own GPU.js kernels, their alternating output textures, and simulation VAOs.
 * The canvas and WebGL context are borrowed from the renderer and never destroyed.
 * Call reset() before the first update or texture access. Kernel compilation is
 * lazy; Emitter warms both update paths using zero-time steps before playback.
 * The owner prevents calls after destroy().
 */
export class GpuSimulation {
  private readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;
  private readonly kernels: IKernelRunShortcut[] = [];
  private readonly vaos: WebGLVertexArrayObject[] = [];
  private readonly inputs = [new SimulationInputs(), new SimulationInputs()];
  private output!: PipelineTexture;
  private nextKernel = UPDATE_KERNEL_A;
  private disposed = false;

  public constructor(
    context: EmitterContext,
    private readonly width: number,
    private readonly rows: number,
    capacity: number,
  ) {
    this.gl = context.gl;
    this.canvas = context.canvas;
    this.validateContext();

    try {
      this.kernels.push(...createKernels(context, this.width, this.rows, capacity));
      this.createVertexArrays();
    } catch (error) {
      // Release kernels and VAOs already created before the failure.
      this.destroy();
      throw error;
    }
  }

  /** Borrow the current output handle; consumers must not delete the texture. */
  public get texture(): WebGLTexture {
    return this.output.texture;
  }

  /** Clear state without changing which update kernel runs next. */
  public clear(): void {
    this.output = this.run(INITIALIZE_KERNEL, NO_ARGUMENTS);
  }

  /** Clear state and restart the alternating update sequence. */
  public reset(): void {
    this.clear();
    this.nextKernel = UPDATE_KERNEL_A;
  }

  /**
   * Read the previous output and write into the other update kernel's texture.
   * Named parameters are packed into this kernel's reusable uniform buffers.
   * Switch outputs only after a successful run; no particle data is read back.
   */
  public update(parameters: SimulationParameters): void {
    const inputs = this.inputs[this.nextKernel - UPDATE_KERNEL_A]!;
    inputs.write(this.output, parameters);
    this.output = this.run(this.nextKernel, inputs.args);
    this.nextKernel = this.nextKernel === UPDATE_KERNEL_A ? UPDATE_KERNEL_B : UPDATE_KERNEL_A;
  }

  /** Release owned resources once; never call GPU.destroy() on the shared context. */
  public destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    for (const kernel of this.kernels) {
      kernel.destroy(true);
    }
    for (const vao of this.vaos) {
      this.gl.deleteVertexArray(vao);
    }
  }

  /** Require renderable float textures and enough room for all particle bands. */
  private validateContext(): void {
    const gl = this.gl;
    if (
      typeof gl.drawArraysInstanced !== 'function' ||
      !gl.getExtension('EXT_color_buffer_float')
    ) {
      throw new Error('GPU simulation requires WebGL2 and EXT_color_buffer_float');
    }
    if (this.rows * PARTICLE_BANDS > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
      throw new RangeError('Capacity exceeds GPU texture limits');
    }
  }

  /** Isolate each kernel's vertex attributes from the renderer and other kernels. */
  private createVertexArrays(): void {
    const gl = this.gl;
    for (let index = 0; index < this.kernels.length; index++) {
      const vao = gl.createVertexArray();
      if (!vao) {
        throw new Error('Unable to allocate simulation VAO');
      }
      this.vaos.push(vao);
    }
  }

  /**
   * Establish simulation GL state and restore any canvas resize from lazy compilation.
   * The renderer must restore its remaining GL state before drawing.
   */
  private run(index: number, args: KernelVariable[]): PipelineTexture {
    const gl = this.gl;
    const kernel = this.kernels[index]!;
    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;
    this.prepareKernel(index, kernel);

    try {
      const result = kernel.apply(null, args);
      if (!isPipelineTexture(result, gl)) {
        throw new Error('GPU.js did not return a shared-context texture');
      }
      return result;
    } finally {
      this.restoreCanvasSize(canvasWidth, canvasHeight);
      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }

  /** Disable rendering-only state so numeric data is written without blending or clipping. */
  private prepareKernel(index: number, kernel: IKernelRunShortcut): void {
    const gl = this.gl;
    gl.bindVertexArray(this.vaos[index]!);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.CULL_FACE);
    gl.colorMask(true, true, true, true);
    // Curve textures contain data, not colors; Pixi may leave alpha premultiplication enabled.
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // GPU.js does not declare this WebGL-specific internal field.
    const size = (kernel.kernel as typeof kernel.kernel & { maxTexSize?: number[] }).maxTexSize;
    gl.viewport(0, 0, size?.[0] ?? this.width, size?.[1] ?? this.rows * PARTICLE_BANDS);
  }

  /** GPU.js may resize the borrowed canvas during a kernel's first compilation. */
  private restoreCanvasSize(width: number, height: number): void {
    // Avoid assigning unchanged dimensions: a canvas resize clears its drawing buffer.
    if (this.canvas.width !== width) {
      this.canvas.width = width;
    }
    if (this.canvas.height !== height) {
      this.canvas.height = height;
    }
  }
}
