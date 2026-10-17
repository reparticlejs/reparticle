import {
  GPU,
  Texture,
  type IGPUKernelSettings,
  type IKernelRunShortcut,
  type KernelVariable,
} from "gpu.js";
import { initialize } from "./gpujs/initialize";
import { spawnMotion } from "./gpujs/spawn-motion";
import { integrate } from "./gpujs/integrate";
import { advancePosition, advancePositionWithGravity, advanceVelocity } from "./behaviors/motion";
import { spawnVariation, spawnDirection, spawnSpeed } from "./behaviors/spawn";
import { defaults, SpawnSchedule, validateOptions, type EmitterOptions } from "./options";
export type { EmitterOptions } from "./options";

interface PipelineTexture extends Texture {
  texture: WebGLTexture;
  context: WebGL2RenderingContext;
}
export interface EmitterContext {
  gl: WebGL2RenderingContext;
  canvas: HTMLCanvasElement;
  capacity?: number;
  seed?: number;
}
/** GPU.js simulation, independent of any renderer. No particle arrays or CPU fallback. */
export class Emitter {
  readonly width = 256;
  readonly rows: number;
  readonly capacity: number;
  x = 0;
  y = 0;
  emitting = true;
  private settings: EmitterOptions;
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

  constructor(context: EmitterContext, options: Partial<EmitterOptions> = {}) {
    this.gl = context.gl;
    this.canvas = context.canvas;
    this.capacity = context.capacity ?? 100_000;
    this.schedule = new SpawnSchedule(this.capacity);
    this.rows = Math.ceil(this.capacity / this.width);
    this.settings = { ...defaults, ...options };
    validateOptions(this.settings);
    this.seed = this.initialSeed = context.seed ?? 1;
    if (!Number.isFinite(this.seed)) throw new RangeError("Seed must be finite");
    const gl = this.gl;
    if (
      typeof gl.drawArraysInstanced !== "function" ||
      !gl.getExtension("EXT_color_buffer_float")
    ) {
      throw new Error("GPU simulation requires WebGL2 and EXT_color_buffer_float");
    }
    if (this.rows * 2 > gl.getParameter(gl.MAX_TEXTURE_SIZE))
      throw new RangeError("Capacity exceeds GPU texture limits");
    const gpu = new GPU({ mode: "webgl2", canvas: this.canvas, context: gl });
    gpu.addFunction(advancePosition);
    gpu.addFunction(advancePositionWithGravity);
    gpu.addFunction(advanceVelocity);
    gpu.addFunction(spawnVariation);
    gpu.addFunction(spawnDirection);
    gpu.addFunction(spawnSpeed);
    gpu.addFunction(spawnMotion);
    const config: IGPUKernelSettings = {
      output: [this.width, this.rows * 2],
      precision: "single",
      pipeline: true,
      immutable: false,
      constants: { width: this.width, rows: this.rows, capacity: this.capacity },
    };
    try {
      for (const source of [initialize, integrate, integrate]) {
        this.kernels.push(gpu.createKernel(source, config));
        const vao = gl.createVertexArray();
        if (!vao) throw new Error("Unable to allocate simulation VAO");
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
  get options(): Readonly<EmitterOptions> {
    return { ...this.settings };
  }
  setOptions(patch: Partial<EmitterOptions>): void {
    this.assertAlive();
    const next = { ...this.settings, ...patch };
    validateOptions(next);
    this.settings = next;
  }
  /** GPU resource handle for renderer adapters. Never calls toArray/readPixels. */
  get texture(): WebGLTexture {
    this.assertAlive();
    return this.output.texture;
  }
  update(dt: number): void {
    this.assertAlive();
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y))
      throw new RangeError("Emitter position must be finite");
    const { start, count } = this.schedule.next(this.emitting ? this.settings.rate : 0, dt);
    const o = this.settings;
    this.output = this.run(
      this.nextKernel,
      this.output,
      dt,
      start,
      count,
      this.x,
      this.y,
      o.speed,
      o.angle,
      o.spread,
      o.gravity,
      o.lifetime,
      this.seed,
    );
    if (count) this.seed = (this.seed + 1) % 65536;
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
    if (this.disposed) return;
    this.disposed = true;
    // Do not call gpu.destroy(): the shared context belongs to the host renderer.
    for (const kernel of this.kernels) kernel.destroy(true);
    for (const vao of this.vaos) this.gl.deleteVertexArray(vao);
  }
  private assertAlive(): void {
    if (this.disposed) throw new Error("Emitter has been destroyed");
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
        !("context" in result) ||
        result.context !== gl ||
        !("texture" in result) ||
        !result.texture
      )
        throw new Error("GPU.js did not return a shared-context texture");
      return result as PipelineTexture;
    } finally {
      // GPU.js changes canvas dimensions on first compilation.
      if (this.canvas.width !== width) this.canvas.width = width;
      if (this.canvas.height !== height) this.canvas.height = height;
      gl.bindVertexArray(null);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }
  }
}

export { parseEffectConfig } from "./config/effect";
export { effectConfigSchema, emitterConfigSchema } from "./config/schema";
export type { EffectConfig, EmitterConfig } from "#types/effect.js";
