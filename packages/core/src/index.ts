import {
  GPU,
  Texture,
  type IGPUKernelSettings,
  type IKernelRunShortcut,
  type KernelVariable,
} from 'gpu.js';

import type { EmitterConfig, EmitterParameters } from '#types/effect.js';
import type { EmitterContext, PipelineTexture } from '#types/emitter.js';

import { circleAngle, circleRadius } from './behaviors/circle';
import { applyGravity } from './behaviors/gravity';
import { advanceAge, particleAlive } from './behaviors/lifetime';
import { advancePosition, advanceVelocity } from './behaviors/motion';
import { spawnVariation, spawnDirection } from './behaviors/spawn';
import { emitterConfigSchema } from './config/schema';
import { updateEmitterConfig } from './config/update-emitter';
import { initialize } from './gpujs/initialize';
import { integrate } from './gpujs/integrate';
import { kernelSource } from './gpujs/kernel-source';
import { spawnBox } from './gpujs/spawn-box';
import { spawnCircle } from './gpujs/spawn-circle';
import { spawnMotion } from './gpujs/spawn-motion';
import { SpawnSchedule } from './spawn-schedule';
export type { EmitterContext } from '#types/emitter.js';

/** GPU.js simulation, independent of any renderer. No particle arrays or CPU fallback. */
export class Emitter {
  readonly width = 256;
  readonly rows: number;
  readonly capacity: number;
  x = 0;
  y = 0;
  emitting = true;
  private settings: EmitterConfig;
  private readonly schedule: SpawnSchedule;
  private readonly kernels: IKernelRunShortcut[] = [];
  private readonly vaos: WebGLVertexArrayObject[] = [];
  private output!: PipelineTexture;
  private nextKernel = 1;
  private disposed = false;
  private seed: number;
  private readonly initialSeed: number;
  readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;

  constructor(context: EmitterContext, definition: EmitterConfig) {
    this.settings = emitterConfigSchema.parse(definition);
    this.gl = context.gl;
    this.canvas = context.canvas;
    this.capacity = this.settings.capacity;
    this.schedule = new SpawnSchedule(this.capacity);
    this.rows = Math.ceil(this.capacity / this.width);
    this.seed = this.initialSeed = this.settings.seed;
    if (!Number.isFinite(this.seed)) {
      throw new RangeError('Seed must be finite');
    }
    const gl = this.gl;
    if (
      typeof gl.drawArraysInstanced !== 'function' ||
      !gl.getExtension('EXT_color_buffer_float')
    ) {
      throw new Error('GPU simulation requires WebGL2 and EXT_color_buffer_float');
    }
    if (this.rows * 2 > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
      throw new RangeError('Capacity exceeds GPU texture limits');
    }
    const gpu = new GPU({ mode: 'webgl2', canvas: this.canvas, context: gl });
    gpu.addFunction(kernelSource(advancePosition));
    gpu.addFunction(kernelSource(applyGravity));
    gpu.addFunction(kernelSource(advanceAge));
    // Keep minified conditional returns numeric in GPU.js's type inference.
    gpu.addFunction(kernelSource(particleAlive), { returnType: 'Number' });
    gpu.addFunction(kernelSource(advanceVelocity));
    gpu.addFunction(kernelSource(spawnVariation));
    gpu.addFunction(kernelSource(spawnDirection));
    gpu.addFunction(kernelSource(spawnMotion));
    gpu.addFunction(kernelSource(circleAngle));
    gpu.addFunction(kernelSource(circleRadius));
    gpu.addFunction(kernelSource(spawnCircle));
    gpu.addFunction(kernelSource(spawnBox));
    const config: IGPUKernelSettings = {
      output: [this.width, this.rows * 2],
      precision: 'single',
      pipeline: true,
      immutable: false,
      constants: { width: this.width, rows: this.rows, capacity: this.capacity },
    };
    try {
      for (const source of [initialize, integrate, integrate]) {
        this.kernels.push(gpu.createKernel(kernelSource(source), config));
        const vao = gl.createVertexArray();
        if (!vao) {
          throw new Error('Unable to allocate simulation VAO');
        }
        this.vaos.push(vao);
      }
      this.reset();
      // Compile and allocate both mutable outputs before playback, then clear again.
      this.update(0);
      this.update(0);
      this.reset();
    } catch (error) {
      this.destroy();
      throw error;
    }
  }
  get id(): string {
    return this.settings.id;
  }
  /** Owned snapshot for serialization or explicit recreation. */
  get configuration(): EmitterConfig {
    return emitterConfigSchema.parse(this.settings);
  }
  setParameters(patch: EmitterParameters): void {
    this.assertAlive();
    this.settings = updateEmitterConfig(this.settings, patch);
  }
  /** GPU resource handle for renderer adapters. Never calls toArray/readPixels. */
  get texture(): WebGLTexture {
    this.assertAlive();
    return this.output.texture;
  }
  update(dt: number): void {
    this.assertAlive();
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
      throw new RangeError('Emitter position must be finite');
    }
    const { start, count } = this.schedule.next(
      this.emitting ? this.settings.emission.rate : 0,
      dt,
    );
    const o = this.settings;
    const shape = o.emission.shape;
    let shapeType = 0;
    let sizeX = 0;
    let sizeY = 0;
    if (shape.type === 'circle') {
      shapeType = 1;
      sizeX = shape.diameter;
    } else if (shape.type === 'box') {
      shapeType = 2;
      sizeX = shape.width;
      sizeY = shape.height;
    }
    this.output = this.run(
      this.nextKernel,
      this.output,
      dt,
      start,
      count,
      this.x,
      this.y,
      o.initial.speed,
      o.initial.direction,
      o.initial.spread,
      o.modifiers.gravity.y,
      o.initial.lifetime,
      this.seed,
      shapeType,
      sizeX,
      sizeY,
    );
    if (count) {
      this.seed = (this.seed + 1) % 65536;
    }
    this.nextKernel = this.nextKernel === 1 ? 2 : 1;
  }
  reset(): void {
    this.assertAlive();
    this.output = this.run(0);
    this.schedule.reset();
    this.nextKernel = 1;
    this.seed = this.initialSeed;
  }
  destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    // Do not call gpu.destroy(): the shared context belongs to the host renderer.
    for (const kernel of this.kernels) {
      kernel.destroy(true);
    }
    for (const vao of this.vaos) {
      this.gl.deleteVertexArray(vao);
    }
  }
  private assertAlive(): void {
    if (this.disposed) {
      throw new Error('Emitter has been destroyed');
    }
  }
  private run(index: number, ...args: KernelVariable[]): PipelineTexture {
    const gl = this.gl;
    const kernel = this.kernels[index]!;
    const width = this.canvas.width,
      height = this.canvas.height;
    gl.bindVertexArray(this.vaos[index]!);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.CULL_FACE);
    gl.colorMask(true, true, true, true);
    // GPU.js does not declare this WebGL-specific internal field.
    const size = (kernel.kernel as typeof kernel.kernel & { maxTexSize?: number[] }).maxTexSize;
    gl.viewport(0, 0, size?.[0] ?? this.width, size?.[1] ?? this.rows * 2);
    try {
      const result = kernel(...args);
      if (
        !(result instanceof Texture) ||
        !('context' in result) ||
        result.context !== gl ||
        !('texture' in result) ||
        !result.texture
      ) {
        throw new Error('GPU.js did not return a shared-context texture');
      }
      return result as PipelineTexture;
    } finally {
      // GPU.js changes canvas dimensions on first compilation.
      if (this.canvas.width !== width) {
        this.canvas.width = width;
      }
      if (this.canvas.height !== height) {
        this.canvas.height = height;
      }
      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
}

export { parseEffectConfig } from './config/effect';
export { effectConfigSchema, emitterConfigSchema } from './config/schema';
export type { EffectConfig, EmitterConfig, EmitterParameters } from '#types/effect.js';
