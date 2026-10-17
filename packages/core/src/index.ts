import { GPU, type IGPUKernelSettings, type IKernelRunShortcut, type KernelVariable } from 'gpu.js';

import type { EmitterConfig, EmitterParameters } from '#types/effect.js';
import type { EmitterContext, PipelineTexture } from '#types/emitter.js';

import { emitterConfigSchema } from './config/schema';
import { updateEmitterConfig } from './config/update-emitter';
import { sampleCurve } from './curves/sample-curve';
import { SampledCurve } from './curves/sampled-curve';
import { SampledShape } from './curves/sampled-shape';
import { EmitterPlayback } from './emitter-playback';
import { EmitterVelocity } from './emitter-velocity';
import functions from './gpujs/functions.json';
import { isPipelineTexture } from './gpujs/is-pipeline-texture';
import { prewarm } from './prewarm';
import { SpawnRate } from './spawn-rate';
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
  private readonly velocity = new EmitterVelocity();
  private readonly schedule: SpawnSchedule;
  private initialRed: SampledCurve;
  private initialGreen: SampledCurve;
  private initialBlue: SampledCurve;
  private initialAlpha: SampledCurve;
  private initialLifetime: SampledCurve;
  private initialRotation: SampledCurve;
  private initialSize: SampledCurve;
  private initialSpeed: SampledCurve;
  private radialMagnitude: SampledCurve;
  private readonly rotationSamples: Float32Array;
  private accelerationMagnitude: SampledCurve;
  private dragMagnitude: SampledCurve;
  private spawnRate: SpawnRate;
  private shape: SampledShape;
  private readonly playback: EmitterPlayback;
  private readonly kernels: IKernelRunShortcut[] = [];
  private readonly vaos: WebGLVertexArrayObject[] = [];
  private output!: PipelineTexture;
  private nextKernel = 1;
  private disposed = false;
  private needsPrewarm = true;
  private seed: number;
  private readonly initialSeed: number;
  readonly gl: WebGL2RenderingContext;
  private readonly canvas: HTMLCanvasElement;

  constructor(context: EmitterContext, definition: EmitterConfig) {
    this.settings = emitterConfigSchema.parse(definition);
    this.spawnRate = new SpawnRate(
      this.settings.emission.rate,
      this.settings.emission.rateSpread,
      this.settings.seed,
    );
    this.initialRotation = new SampledCurve(this.settings.initial.rotation);
    this.initialSize = new SampledCurve(this.settings.initial.size);
    this.initialSpeed = new SampledCurve(this.settings.initial.speed);
    this.initialRed = new SampledCurve(this.settings.initial.red);
    this.initialGreen = new SampledCurve(this.settings.initial.green);
    this.initialBlue = new SampledCurve(this.settings.initial.blue);
    this.initialAlpha = new SampledCurve(this.settings.initial.alpha);
    this.initialLifetime = new SampledCurve(this.settings.initial.lifetime);
    this.dragMagnitude = new SampledCurve(this.settings.modifiers.drag.magnitude);
    this.radialMagnitude = new SampledCurve(this.settings.modifiers.radial.magnitude);
    this.rotationSamples = sampleCurve(this.settings.overLifetime.rotation);
    this.accelerationMagnitude = new SampledCurve(this.settings.modifiers.acceleration.magnitude);
    this.shape = new SampledShape(this.settings.emission.shape);
    this.gl = context.gl;
    this.canvas = context.canvas;
    this.capacity = this.settings.capacity;
    this.schedule = new SpawnSchedule(this.capacity);
    this.playback = new EmitterPlayback(
      this.settings.duration,
      this.settings.playMode,
      this.settings.startDelay,
      this.settings,
    );
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
    if (this.rows * 4 > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
      throw new RangeError('Capacity exceeds GPU texture limits');
    }
    const gpu = new GPU({ mode: 'webgl2', canvas: this.canvas, context: gl });
    gpu.addFunction(functions.advancePosition);
    gpu.addFunction(functions.applyAcceleration);
    gpu.addFunction(functions.applyRadial);
    gpu.addFunction(functions.particleHeading);
    gpu.addFunction(functions.advanceAge);
    // The alive flag is numeric in GPU storage.
    gpu.addFunction(functions.particleAlive, { returnType: 'Number' });
    gpu.addFunction(functions.advanceVelocity);
    gpu.addFunction(functions.spawnVariation);
    gpu.addFunction(functions.spawnDirection);
    gpu.addFunction(functions.spawnMotion);
    gpu.addFunction(functions.circleAngle);
    gpu.addFunction(functions.circleRadius);
    gpu.addFunction(functions.spawnCircle);
    gpu.addFunction(functions.spawnBox);
    gpu.addFunction(functions.spawnCone2D);
    gpu.addFunction(functions.spawnRotation);
    gpu.addFunction(functions.propertyVariation);
    gpu.addFunction(functions.applyDrag);
    const config: IGPUKernelSettings = {
      output: [this.width, this.rows * 4],
      precision: 'single',
      pipeline: true,
      immutable: false,
      constants: { width: this.width, rows: this.rows, capacity: this.capacity },
    };
    try {
      for (const source of [functions.initialize, functions.integrate, functions.integrate]) {
        this.kernels.push(gpu.createKernel(source, config));
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
  /** Emission eligibility at the current clock, before any pending prewarm. */
  get isEmitting(): boolean {
    return this.emitting && this.playback.emitting;
  }
  get id(): string {
    return this.settings.id;
  }
  /** Uniform emitter scale; independent of particle size curves. */
  get scale(): number {
    return this.settings.scale;
  }

  set scale(value: number) {
    this.setParameters({ scale: value });
  }

  /** Emitter rotation in degrees, counterclockwise like Defold. */
  get rotation(): number {
    return this.settings.rotation;
  }

  set rotation(value: number) {
    this.setParameters({ rotation: value });
  }

  get space(): EmitterConfig['space'] {
    return this.settings.space;
  }

  /** Owned snapshot for serialization or explicit recreation. */
  get configuration(): EmitterConfig {
    return emitterConfigSchema.parse(this.settings);
  }
  setParameters(patch: EmitterParameters): void {
    this.assertAlive();
    const settings = updateEmitterConfig(this.settings, patch);
    const radialMagnitude =
      patch.modifiers?.radial?.magnitude === undefined
        ? this.radialMagnitude
        : new SampledCurve(settings.modifiers.radial.magnitude);
    const accelerationMagnitude =
      patch.modifiers?.acceleration?.magnitude === undefined
        ? this.accelerationMagnitude
        : new SampledCurve(settings.modifiers.acceleration.magnitude);
    const dragMagnitude =
      patch.modifiers?.drag?.magnitude === undefined
        ? this.dragMagnitude
        : new SampledCurve(settings.modifiers.drag.magnitude);
    const shape =
      patch.emission?.shape === undefined ? this.shape : new SampledShape(settings.emission.shape);
    const spawnRate =
      patch.emission?.rate === undefined
        ? this.spawnRate
        : new SpawnRate(settings.emission.rate, settings.emission.rateSpread, settings.seed);
    const initialSpeed =
      patch.initial?.speed === undefined
        ? this.initialSpeed
        : new SampledCurve(settings.initial.speed);
    const initialSize =
      patch.initial?.size === undefined
        ? this.initialSize
        : new SampledCurve(settings.initial.size);
    const initialRotation =
      patch.initial?.rotation === undefined
        ? this.initialRotation
        : new SampledCurve(settings.initial.rotation);
    const initialRed =
      patch.initial?.red === undefined ? this.initialRed : new SampledCurve(settings.initial.red);
    const initialGreen =
      patch.initial?.green === undefined
        ? this.initialGreen
        : new SampledCurve(settings.initial.green);
    const initialBlue =
      patch.initial?.blue === undefined
        ? this.initialBlue
        : new SampledCurve(settings.initial.blue);
    const initialAlpha =
      patch.initial?.alpha === undefined
        ? this.initialAlpha
        : new SampledCurve(settings.initial.alpha);
    const initialLifetime =
      patch.initial?.lifetime === undefined
        ? this.initialLifetime
        : new SampledCurve(settings.initial.lifetime);
    this.settings = settings;
    this.radialMagnitude = radialMagnitude;
    this.accelerationMagnitude = accelerationMagnitude;
    this.dragMagnitude = dragMagnitude;
    this.shape = shape;
    this.initialLifetime = initialLifetime;
    this.initialRed = initialRed;
    this.initialGreen = initialGreen;
    this.initialBlue = initialBlue;
    this.initialAlpha = initialAlpha;
    this.initialRotation = initialRotation;
    this.initialSize = initialSize;
    this.initialSpeed = initialSpeed;
    this.spawnRate = spawnRate;
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
    if (!Number.isFinite(dt) || dt < 0 || dt > 0.1) {
      throw new RangeError('Step must be between 0 and 0.1 seconds');
    }
    if (dt > 0 && this.needsPrewarm) {
      this.needsPrewarm = false;
      prewarm(
        this.settings.startOffset,
        this.initialLifetime.maximum + this.settings.initial.lifetimeSpread,
        (seconds) => this.step(seconds),
      );
    }
    this.velocity.update(this.x, this.y, dt);
    this.step(dt);
  }
  private step(dt: number): void {
    const active = this.playback.advance(dt);
    const rate = active && this.emitting ? this.spawnRate.at(this.playback.normalizedAge) : 0;
    const { start, count } = this.schedule.next(rate, dt);
    const o = this.settings;
    const worldSpace = o.space === 'world';
    const scale = worldSpace ? o.scale : 1;
    const rotation = worldSpace ? o.rotation : 0;
    const radians = (-rotation * Math.PI) / 180;
    const accelerationRadians = -((rotation + o.modifiers.acceleration.rotation) * Math.PI) / 180;
    const dragRadians = -((rotation + o.modifiers.drag.rotation) * Math.PI) / 180;
    const radial = o.modifiers.radial;
    const radialX =
      (worldSpace ? this.x : 0) +
      (Math.cos(radians) * radial.x - Math.sin(radians) * radial.y) * scale;
    const radialY =
      (worldSpace ? this.y : 0) +
      (Math.sin(radians) * radial.x + Math.cos(radians) * radial.y) * scale;
    const initialRotation = this.initialRotation.at(this.playback.normalizedAge);
    const particleRotation =
      o.orientation === 'movement-direction' ? initialRotation : initialRotation + rotation;
    this.output = this.run(
      this.nextKernel,
      this.output,
      dt,
      start,
      count,
      worldSpace ? this.x : 0,
      worldSpace ? this.y : 0,
      this.initialSpeed.at(this.playback.normalizedAge),
      o.initial.direction,
      o.initial.spread,
      this.accelerationMagnitude.at(this.playback.normalizedAge) * scale,
      this.initialLifetime.at(this.playback.normalizedAge),
      this.seed,
      this.shape.type,
      this.shape.x.at(this.playback.normalizedAge),
      this.shape.y.at(this.playback.normalizedAge),
      this.initialSize.at(this.playback.normalizedAge),
      this.initialAlpha.at(this.playback.normalizedAge),
      this.initialRed.at(this.playback.normalizedAge),
      this.initialGreen.at(this.playback.normalizedAge),
      this.initialBlue.at(this.playback.normalizedAge),
      particleRotation,
      o.orientation === 'initial-direction' ? 1 : 0,
      o.initial.speedSpread,
      o.initial.lifetimeSpread,
      o.initial.sizeSpread,
      o.initial.rotationSpread,
      o.initial.redSpread,
      o.initial.greenSpread,
      o.initial.blueSpread,
      o.initial.alphaSpread,
      this.shape.spreadX,
      this.shape.spreadY,
      worldSpace ? this.velocity.x * o.inheritVelocity : 0,
      worldSpace ? this.velocity.y * o.inheritVelocity : 0,
      Math.cos(radians),
      Math.sin(radians),
      scale,
      this.dragMagnitude.at(this.playback.normalizedAge),
      o.modifiers.drag.spread,
      o.modifiers.drag.useDirection ? 1 : 0,
      Math.cos(dragRadians),
      Math.sin(dragRadians),
      o.modifiers.acceleration.spread * scale,
      Math.sin(accelerationRadians),
      -Math.cos(accelerationRadians),
      this.radialMagnitude.at(this.playback.normalizedAge) * scale,
      radial.spread * scale,
      radialX,
      radialY,
      radial.maxDistance * scale,
      this.rotationSamples,
      o.orientation === 'movement-direction' ? 1 : 0,
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
    this.playback.reset();
    this.velocity.reset();
    this.needsPrewarm = true;
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
    // Curve textures contain data, not colors; Pixi may leave alpha premultiplication enabled.
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    // GPU.js does not declare this WebGL-specific internal field.
    const size = (kernel.kernel as typeof kernel.kernel & { maxTexSize?: number[] }).maxTexSize;
    gl.viewport(0, 0, size?.[0] ?? this.width, size?.[1] ?? this.rows * 4);
    try {
      const result = kernel(...args);
      if (!isPipelineTexture(result, gl)) {
        throw new Error('GPU.js did not return a shared-context texture');
      }
      return result;
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

export { EmitterPlayback } from './emitter-playback';
export { propertyVariation } from './behaviors/property-variation';
export { SampledCurve } from './curves/sampled-curve';
export { SpawnRate } from './spawn-rate';
export { prewarm } from './prewarm';

export { sampleCurve, CURVE_SEGMENTS } from './curves/sample-curve';
export type { Curve, CurvePoint, ScalarProperty } from '#types/curve.js';
