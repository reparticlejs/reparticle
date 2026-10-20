import type { EmitterConfig, EmitterParameters, ModifierConfig } from '#types/effect.js';
import type { EmitterContext } from '#types/emitter.js';
import type { InitialPropertyCurves } from '#types/initial-property-curves.js';
import type { EmitterState, EmitterStateListener, StopOptions } from '#types/lifecycle.js';

import { applyEmitterPatch } from '../config/apply-emitter-patch';
import { emitterConfigSchema } from '../config/schemas/definition/emitter';
import { modifiersSchema } from '../config/schemas/definition/modifiers';
import { sampleCurve } from '../curves/sample-curve';
import { sampleInitialProperties } from '../curves/sample-initial-properties';
import { SampledShape } from '../curves/sampled-shape';
import { GpuSimulation } from './gpu/simulation';
import { ModifierSampler } from './modifiers/sampler';
import { ParticleSlots } from './particles/slots';
import { EmitterPlayback } from './playback/emitter';
import { prewarm } from './playback/prewarm';
import { SpawnRate } from './playback/spawn-rate';
import { SpawnSchedule } from './playback/spawn-schedule';
import { EffectTransform } from './transforms/effect';
import { EmitterVelocity } from './transforms/velocity';

/**
 * Coordinate one emitter's playback, CPU slot metadata, and GPU simulation.
 * Particle state stays in GPU textures; CPU metadata controls birth admission,
 * expiration, and draw order without readbacks. The renderer owns the GL context.
 */
export class Emitter {
  public readonly width = 256;
  public readonly rows: number;
  public readonly capacity: number;
  public readonly gl: WebGL2RenderingContext;
  /** Gate new births without pausing the simulation or resetting playback. */
  public emitting = true;

  // Validated configuration and sampled data.
  private settings: EmitterConfig;
  private readonly sharedModifiers: ModifierConfig[];
  private modifiers: ModifierSampler;
  private initial: InitialPropertyCurves;
  private spawnRate: SpawnRate;
  private shape: SampledShape;
  private readonly angularVelocitySamples: Float32Array;
  private readonly rotationSamples: Float32Array;

  // Playback, birth allocation, and inherited motion.
  private readonly playback: EmitterPlayback;
  private readonly schedule: SpawnSchedule;
  private readonly slots: ParticleSlots;
  private readonly velocity = new EmitterVelocity();
  private seed: number;
  private readonly initialSeed: number;
  private needsPrewarm = true;

  private readonly simulation: GpuSimulation;
  private disposed = false;

  private readonly listeners = new Set<EmitterStateListener>();
  private notifying = false;

  public constructor(
    context: EmitterContext,
    definition: EmitterConfig,
    sharedModifiers: unknown = [],
    public readonly effectTransform = new EffectTransform(),
  ) {
    this.settings = emitterConfigSchema.parse(definition);
    this.sharedModifiers = modifiersSchema.parse(sharedModifiers);
    this.modifiers = new ModifierSampler(this.settings.modifiers, this.sharedModifiers);
    this.spawnRate = new SpawnRate(
      this.settings.emission.rate,
      this.settings.emission.rateSpread,
      this.settings.seed,
    );
    this.initial = sampleInitialProperties(this.settings.initial);
    this.angularVelocitySamples = sampleCurve(this.settings.overLifetime.angularVelocity);
    this.rotationSamples = sampleCurve(
      this.settings.orientation === 'angular-velocity' ? 0 : this.settings.overLifetime.rotation,
    );
    this.shape = new SampledShape(this.settings.emission.shape);

    this.gl = context.gl;
    this.capacity = this.settings.capacity;
    this.rows = Math.ceil(this.capacity / this.width);

    this.schedule = new SpawnSchedule(this.capacity);
    this.slots = new ParticleSlots(this.capacity, true);
    this.playback = new EmitterPlayback(
      this.settings.duration,
      this.settings.playMode,
      this.settings.startDelay,
      this.settings,
    );

    this.initialSeed = this.settings.seed;
    this.seed = this.initialSeed;
    if (!Number.isFinite(this.seed)) {
      throw new RangeError('Seed must be finite');
    }
    this.simulation = new GpuSimulation(context, this.width, this.rows, this.capacity);
    try {
      this.warmSimulation();
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

  /** Subscribe to queued lifecycle transitions; returns an unsubscribe function. */
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
      this.simulation.clear();
      this.slots.reset();
    }
    this.needsPrewarm = false;
    this.playback.stop();
    this.notifyStateChanges();
  }

  /** Stop emission and remove all particles immediately. */
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

  /** Apply a validated patch atomically, rebuilding only affected sampled data. */
  public setParameters(patch: EmitterParameters): void {
    this.assertAlive();
    const settings = applyEmitterPatch(this.settings, patch);
    const modifiers =
      patch.modifiers === undefined
        ? this.modifiers
        : new ModifierSampler(settings.modifiers, this.sharedModifiers);
    const shape =
      patch.emission?.shape === undefined ? this.shape : new SampledShape(settings.emission.shape);
    const spawnRate =
      patch.emission?.rate === undefined
        ? this.spawnRate
        : new SpawnRate(settings.emission.rate, settings.emission.rateSpread, settings.seed);
    const initial = sampleInitialProperties(settings.initial, this.initial, patch.initial);

    // Commit only after every replacement has been validated and sampled.
    this.settings = settings;
    this.modifiers = modifiers;
    this.shape = shape;
    this.initial = initial;
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
    return this.simulation.texture;
  }

  /**
   * Advance by 0–0.1 seconds. The first positive step runs pending prewarm first.
   * Zero-time updates initialize GPU output without advancing particle ages.
   * State notifications are delivered after the simulation work completes.
   */
  public update(seconds: number): void {
    this.assertAlive();
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
      throw new RangeError('Emitter position must be finite');
    }
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 0.1) {
      throw new RangeError('Step must be between 0 and 0.1 seconds');
    }
    if (this.state === 'sleeping') {
      return;
    }
    if (seconds > 0 && this.needsPrewarm) {
      this.needsPrewarm = false;
      prewarm(
        this.settings.startOffset,
        this.initial.lifetime.maximum + this.settings.initial.lifetimeSpread,
        (stepSeconds) => this.step(stepSeconds),
      );
    }
    this.velocity.update(this.worldX, this.worldY, seconds);
    this.step(seconds);
    this.notifyStateChanges();
  }

  /** Clear particles and restore the initial clock and seed; preserve the emitting gate. */
  public reset(): void {
    this.assertAlive();
    this.simulation.reset();
    this.schedule.reset();
    this.slots.reset();
    this.playback.reset();
    this.velocity.reset();
    this.needsPrewarm = true;
    this.seed = this.initialSeed;
    this.notifyStateChanges();
  }

  /** Release owned resources once, leaving the shared WebGL context alive. */
  public destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.listeners.clear();
    this.simulation.destroy();
  }

  /** Compile both update paths with zero-time steps, then restore fresh playback. */
  private warmSimulation(): void {
    this.reset();
    this.update(0);
    this.update(0);
    this.reset();
  }

  /** Queue reentrant state changes until the current notification batch finishes. */
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

  /** Order matters: playback → birth requests → slot allocation → GPU update → draining. */
  private step(seconds: number): void {
    if (this.state === 'sleeping') {
      return;
    }
    const shouldEmit = this.playback.advance(seconds);
    const emitterAge = this.playback.normalizedAge;
    const rate = shouldEmit && this.emitting ? this.spawnRate.at(emitterAge) : 0;
    const requested = this.schedule.next(rate, seconds);
    const lifetime = this.initial.lifetime.at(emitterAge);
    const settings = this.settings;

    const birthCount = this.slots.advance(
      seconds,
      requested,
      lifetime,
      settings.initial.lifetimeSpread,
      this.seed,
      Math.max(0, this.initial.lifetime.maximum),
    );

    this.integrate(seconds, birthCount, lifetime, emitterAge);

    if (seconds > 0) {
      this.playback.finish(this.slots.empty);
    }
    if (birthCount > 0) {
      this.seed = (this.seed + 1) % 65536;
    }
  }

  /**
   * Bind the positional arguments expected by simulation/kernels/integrate.ts.
   * This is one GPU pass; argument order is part of the kernel contract.
   */
  private integrate(
    seconds: number,
    birthCount: number,
    lifetime: number,
    emitterAge: number,
  ): void {
    const settings = this.settings;
    const worldSpace = settings.space === 'world';
    const handedness = worldSpace ? this.worldHandedness : 1;
    const scale = worldSpace ? this.worldScale : 1;
    const rotation = worldSpace ? this.worldRotation : 0;
    const radians = (-rotation * Math.PI) / 180;
    const initialRotation = this.initial.rotation.at(emitterAge) * handedness;
    const particleRotation =
      settings.orientation === 'movement-direction' ? initialRotation : initialRotation + rotation;
    this.simulation.update(
      // Time and births for this step
      seconds,
      this.slots.spawnMask,
      birthCount,
      // Birth position, motion, lifetime, and shape
      worldSpace ? this.worldX : 0,
      worldSpace ? this.worldY : 0,
      this.initial.speed.at(emitterAge),
      settings.initial.direction,
      settings.initial.spread,
      lifetime,
      this.seed,
      this.shape.type,
      this.shape.dimensionX.at(emitterAge),
      this.shape.dimensionY.at(emitterAge),
      // Birth appearance
      this.initial.size.at(emitterAge),
      this.initial.alpha.at(emitterAge),
      this.initial.red.at(emitterAge),
      this.initial.green.at(emitterAge),
      this.initial.blue.at(emitterAge),
      particleRotation,
      settings.orientation === 'initial-direction' ? 1 : 0,
      // Per-particle variation
      settings.initial.speedSpread,
      settings.initial.lifetimeSpread,
      settings.initial.sizeSpread,
      settings.initial.rotationSpread,
      settings.initial.redSpread,
      settings.initial.greenSpread,
      settings.initial.blueSpread,
      settings.initial.alphaSpread,
      this.shape.dimensionSpreadX,
      this.shape.dimensionSpreadY,
      // Inherited motion and emitter transform
      worldSpace ? this.velocity.x * settings.inheritVelocity : 0,
      worldSpace ? this.velocity.y * settings.inheritVelocity : 0,
      Math.cos(radians),
      Math.sin(radians),
      scale,
      // Orientation and angular motion
      this.rotationSamples,
      settings.orientation === 'movement-direction' ? 1 : 0,
      this.initial.angularVelocity.at(emitterAge),
      settings.initial.angularVelocitySpread,
      this.angularVelocitySamples,
      settings.orientation === 'angular-velocity' ? 1 : 0,
      // Geometry and forces
      this.initial.stretchX.at(emitterAge),
      this.initial.stretchY.at(emitterAge),
      settings.initial.stretchXSpread,
      settings.initial.stretchYSpread,
      this.modifiers.sample(
        this.playback.modifierAge,
        !worldSpace,
        this.x,
        this.y,
        settings.rotation,
        settings.scale,
        this.effectTransform,
      ),
      handedness,
    );
  }

  private assertAlive(): void {
    if (this.disposed) {
      throw new Error('Emitter has been destroyed');
    }
  }
}
