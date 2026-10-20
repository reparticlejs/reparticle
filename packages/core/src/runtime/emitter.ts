import type { IKernelRunShortcut, KernelVariable } from 'gpu.js';

import type { EmitterConfig, EmitterParameters, ModifierConfig } from '#types/effect.js';
import type { EmitterContext, PipelineTexture } from '#types/emitter.js';
import type { EmitterState, EmitterStateListener, StopOptions } from '#types/lifecycle.js';

import { applyEmitterPatch } from '../config/apply-emitter-patch';
import { emitterConfigSchema } from '../config/schemas/definition/emitter';
import { modifiersSchema } from '../config/schemas/definition/modifiers';
import { sampleCurve } from '../curves/sample-curve';
import { SampledCurve } from '../curves/sampled-curve';
import { SampledShape } from '../curves/sampled-shape';
import { createKernels } from './create-kernels';
import { EffectTransform } from './effect-transform';
import { EmitterPlayback } from './emitter-playback';
import { EmitterVelocity } from './emitter-velocity';
import { isPipelineTexture } from './is-pipeline-texture';
import { Modifiers } from './modifiers';
import { ParticleSlots } from './particle-slots';
import { prewarm } from './prewarm';
import { SpawnRate } from './spawn-rate';
import { SpawnSchedule } from './spawn-schedule';

/** GPU.js simulation, independent of any renderer. Only slot allocation and lifetime metadata live on the CPU. */
export class Emitter {
  public readonly width = 256;
  public readonly rows: number;
  public readonly capacity: number;
  public emitting = true;
  private settings: EmitterConfig;
  private readonly velocity = new EmitterVelocity();
  private readonly schedule: SpawnSchedule;
  private readonly slots: ParticleSlots;
  private readonly listeners = new Set<EmitterStateListener>();
  private notifying = false;
  private initialRed: SampledCurve;
  private initialGreen: SampledCurve;
  private initialBlue: SampledCurve;
  private initialAlpha: SampledCurve;
  private initialLifetime: SampledCurve;
  private initialStretchX: SampledCurve;
  private initialStretchY: SampledCurve;
  private initialAngularVelocity: SampledCurve;
  private readonly angularVelocitySamples: Float32Array;
  private initialRotation: SampledCurve;
  private initialSize: SampledCurve;
  private initialSpeed: SampledCurve;
  private readonly rotationSamples: Float32Array;
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
  public readonly gl: WebGL2RenderingContext;
  private readonly sharedModifiers: ModifierConfig[];
  private modifiers: Modifiers;
  private readonly canvas: HTMLCanvasElement;

  public constructor(
    context: EmitterContext,
    definition: EmitterConfig,
    sharedModifiers: unknown = [],
    public readonly effectTransform = new EffectTransform(),
  ) {
    this.settings = emitterConfigSchema.parse(definition);
    this.sharedModifiers = modifiersSchema.parse(sharedModifiers);
    this.modifiers = new Modifiers(this.settings.modifiers, this.sharedModifiers);
    this.spawnRate = new SpawnRate(
      this.settings.emission.rate,
      this.settings.emission.rateSpread,
      this.settings.seed,
    );
    this.initialStretchX = new SampledCurve(this.settings.initial.stretchX);
    this.initialStretchY = new SampledCurve(this.settings.initial.stretchY);
    this.initialAngularVelocity = new SampledCurve(this.settings.initial.angularVelocity);
    this.angularVelocitySamples = sampleCurve(this.settings.overLifetime.angularVelocity);
    this.initialRotation = new SampledCurve(this.settings.initial.rotation);
    this.initialSize = new SampledCurve(this.settings.initial.size);
    this.initialSpeed = new SampledCurve(this.settings.initial.speed);
    this.initialRed = new SampledCurve(this.settings.initial.red);
    this.initialGreen = new SampledCurve(this.settings.initial.green);
    this.initialBlue = new SampledCurve(this.settings.initial.blue);
    this.initialAlpha = new SampledCurve(this.settings.initial.alpha);
    this.initialLifetime = new SampledCurve(this.settings.initial.lifetime);
    this.rotationSamples = sampleCurve(
      this.settings.orientation === 'angular-velocity' ? 0 : this.settings.overLifetime.rotation,
    );
    this.shape = new SampledShape(this.settings.emission.shape);
    this.gl = context.gl;
    this.canvas = context.canvas;
    this.capacity = this.settings.capacity;
    this.schedule = new SpawnSchedule(this.capacity);
    this.slots = new ParticleSlots(this.capacity, true);
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
    if (this.rows * 5 > gl.getParameter(gl.MAX_TEXTURE_SIZE)) {
      throw new RangeError('Capacity exceeds GPU texture limits');
    }
    try {
      this.kernels.push(...createKernels(context, this.width, this.rows, this.capacity));
      for (let index = 0; index < this.kernels.length; index++) {
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
  public get worldX(): number {
    return this.effectTransform.applyX(this.x, this.y);
  }
  public get worldY(): number {
    return this.effectTransform.applyY(this.x, this.y);
  }
  public get worldRotation(): number {
    return this.effectTransform.rotation + this.effectTransform.handedness * this.rotation;
  }
  public get worldHandedness(): 1 | -1 {
    return this.effectTransform.handedness;
  }
  public get worldScale(): number {
    return this.effectTransform.scale * this.scale;
  }

  public get state(): EmitterState {
    return this.playback.state;
  }

  public onStateChange(listener: EmitterStateListener): () => void {
    this.assertAlive();
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Restart from the initial state, including delay, seed and prewarm. */
  public play(): void {
    this.emitting = true;
    this.reset();
  }

  /** Finish the current cycle, then drain existing particles. */
  public retire(): void {
    this.assertAlive();
    this.playback.retire();
  }

  /** Stop spawning; existing particles drain unless clear is requested. */
  public stop({ clear = false }: StopOptions = {}): void {
    this.assertAlive();
    if (clear) {
      this.output = this.run(0);
      this.slots.reset();
    }
    this.needsPrewarm = false;
    this.playback.stop();
    this.notifyStateChanges();
  }

  public clear(): void {
    this.stop({ clear: true });
  }

  /** Emission eligibility at the current clock, before any pending prewarm. */
  public get isEmitting(): boolean {
    return this.emitting && this.playback.emitting;
  }
  public get id(): string {
    return this.settings.id;
  }
  /** Emitter origin in effect coordinates; rotation and scale apply around this point. */
  public get x(): number {
    return this.settings.position.x;
  }

  public set x(value: number) {
    this.assertAlive();
    if (!Number.isFinite(value)) {
      throw new RangeError('Emitter position must be finite');
    }
    this.settings.position.x = value;
  }

  public get y(): number {
    return this.settings.position.y;
  }

  public set y(value: number) {
    this.assertAlive();
    if (!Number.isFinite(value)) {
      throw new RangeError('Emitter position must be finite');
    }
    this.settings.position.y = value;
  }

  /** Uniform emitter scale; independent of particle size curves. */
  public get scale(): number {
    return this.settings.scale;
  }

  public set scale(value: number) {
    this.setParameters({ scale: value });
  }

  /** Emitter rotation in counterclockwise degrees. */
  public get rotation(): number {
    return this.settings.rotation;
  }

  public set rotation(value: number) {
    this.setParameters({ rotation: value });
  }

  /** Whether Y stretch follows the current simulation speed. */
  public get stretchWithVelocity(): boolean {
    return this.settings.stretchWithVelocity;
  }

  public get space(): EmitterConfig['space'] {
    return this.settings.space;
  }

  /** Owned snapshot for serialization or explicit recreation. */
  public get configuration(): EmitterConfig {
    return emitterConfigSchema.parse(this.settings);
  }
  public setParameters(patch: EmitterParameters): void {
    this.assertAlive();
    const settings = applyEmitterPatch(this.settings, patch);
    const modifiers =
      patch.modifiers === undefined
        ? this.modifiers
        : new Modifiers(settings.modifiers, this.sharedModifiers);
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
    const initialStretchX =
      patch.initial?.stretchX === undefined
        ? this.initialStretchX
        : new SampledCurve(settings.initial.stretchX);
    const initialStretchY =
      patch.initial?.stretchY === undefined
        ? this.initialStretchY
        : new SampledCurve(settings.initial.stretchY);
    const initialAngularVelocity =
      patch.initial?.angularVelocity === undefined
        ? this.initialAngularVelocity
        : new SampledCurve(settings.initial.angularVelocity);
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
    this.modifiers = modifiers;
    this.shape = shape;
    this.initialLifetime = initialLifetime;
    this.initialRed = initialRed;
    this.initialGreen = initialGreen;
    this.initialBlue = initialBlue;
    this.initialAlpha = initialAlpha;
    this.initialStretchX = initialStretchX;
    this.initialStretchY = initialStretchY;
    this.initialAngularVelocity = initialAngularVelocity;
    this.initialRotation = initialRotation;
    this.initialSize = initialSize;
    this.initialSpeed = initialSpeed;
    this.spawnRate = spawnRate;
  }
  /** Changes when allocation or particle ages change, including reset and clear. */
  public get particleRevision(): number {
    return this.slots.revision;
  }

  /** Copy the final logical order; simulation texels always remain in their original slots. */
  public copyParticleOrder(target: Uint32Array): number {
    this.assertAlive();
    return this.slots.copyOrder(target);
  }

  /** GPU resource handle for renderer adapters. Never calls toArray/readPixels. */
  public get texture(): WebGLTexture {
    this.assertAlive();
    return this.output.texture;
  }
  public update(dt: number): void {
    this.assertAlive();
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
      throw new RangeError('Emitter position must be finite');
    }
    if (!Number.isFinite(dt) || dt < 0 || dt > 0.1) {
      throw new RangeError('Step must be between 0 and 0.1 seconds');
    }
    if (this.state === 'sleeping') {
      return;
    }
    if (dt > 0 && this.needsPrewarm) {
      this.needsPrewarm = false;
      prewarm(
        this.settings.startOffset,
        this.initialLifetime.maximum + this.settings.initial.lifetimeSpread,
        (seconds) => this.step(seconds),
      );
    }
    this.velocity.update(this.worldX, this.worldY, dt);
    this.step(dt);
    this.notifyStateChanges();
  }
  public reset(): void {
    this.assertAlive();
    this.output = this.run(0);
    this.schedule.reset();
    this.slots.reset();
    this.playback.reset();
    this.velocity.reset();
    this.needsPrewarm = true;
    this.nextKernel = 1;
    this.seed = this.initialSeed;
    this.notifyStateChanges();
  }
  public destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.listeners.clear();
    // Do not call gpu.destroy(): the shared context belongs to the host renderer.
    for (const kernel of this.kernels) {
      kernel.destroy(true);
    }
    for (const vao of this.vaos) {
      this.gl.deleteVertexArray(vao);
    }
  }

  private notifyStateChanges(): void {
    if (this.notifying) {
      return;
    }
    this.notifying = true;
    try {
      let transitions = this.playback.takeTransitions();
      while (transitions.length > 0) {
        for (const state of transitions) {
          for (const listener of [...this.listeners]) {
            listener({ emitterId: this.id, state });
          }
        }
        transitions = this.playback.takeTransitions();
      }
    } finally {
      this.notifying = false;
    }
  }
  private step(dt: number): void {
    if (this.state === 'sleeping') {
      return;
    }
    const active = this.playback.advance(dt);
    const rate = active && this.emitting ? this.spawnRate.at(this.playback.normalizedAge) : 0;
    const requested = this.schedule.next(rate, dt);
    const lifetime = this.initialLifetime.at(this.playback.normalizedAge);
    const o = this.settings;
    const count = this.slots.advance(
      dt,
      requested,
      lifetime,
      o.initial.lifetimeSpread,
      this.seed,
      Math.max(0, this.initialLifetime.maximum),
    );
    const worldSpace = o.space === 'world';
    const handedness = worldSpace ? this.worldHandedness : 1;
    const scale = worldSpace ? this.worldScale : 1;
    const rotation = worldSpace ? this.worldRotation : 0;
    const radians = (-rotation * Math.PI) / 180;
    const initialRotation = this.initialRotation.at(this.playback.normalizedAge) * handedness;
    const particleRotation =
      o.orientation === 'movement-direction' ? initialRotation : initialRotation + rotation;
    this.output = this.run(
      this.nextKernel,
      this.output,
      dt,
      this.slots.spawnMask,
      count,
      worldSpace ? this.worldX : 0,
      worldSpace ? this.worldY : 0,
      this.initialSpeed.at(this.playback.normalizedAge),
      o.initial.direction,
      o.initial.spread,
      lifetime,
      this.seed,
      this.shape.type,
      this.shape.dimensionX.at(this.playback.normalizedAge),
      this.shape.dimensionY.at(this.playback.normalizedAge),
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
      this.shape.dimensionSpreadX,
      this.shape.dimensionSpreadY,
      worldSpace ? this.velocity.x * o.inheritVelocity : 0,
      worldSpace ? this.velocity.y * o.inheritVelocity : 0,
      Math.cos(radians),
      Math.sin(radians),
      scale,
      this.rotationSamples,
      o.orientation === 'movement-direction' ? 1 : 0,
      this.initialAngularVelocity.at(this.playback.normalizedAge),
      o.initial.angularVelocitySpread,
      this.angularVelocitySamples,
      o.orientation === 'angular-velocity' ? 1 : 0,
      this.initialStretchX.at(this.playback.normalizedAge),
      this.initialStretchY.at(this.playback.normalizedAge),
      o.initial.stretchXSpread,
      o.initial.stretchYSpread,
      this.modifiers.sample(
        this.playback.modifierAge,
        !worldSpace,
        this.x,
        this.y,
        o.rotation,
        o.scale,
        this.effectTransform,
      ),
      handedness,
    );
    if (dt > 0) {
      this.playback.finish(this.slots.empty);
    }
    if (count) {
      this.seed = (this.seed + 1) % 65536;
    }
    this.nextKernel = this.nextKernel === 1 ? 2 : 1;
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
    gl.viewport(0, 0, size?.[0] ?? this.width, size?.[1] ?? this.rows * 5);
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
