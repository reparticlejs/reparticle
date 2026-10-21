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
import { createSimulationParameters } from './gpu/parameters';
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

  private simulation: GpuSimulation | null = null;
  private context: EmitterContext | null = null;
  private readonly simulationParameters = createSimulationParameters();
  private disposed = false;

  private readonly listeners = new Set<EmitterStateListener>();
  private notifying = false;

  public constructor(
    context: EmitterContext | null,
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
    if (context) {
      this.initialize(context);
    }
  }

  /** Attach the renderer's context once. CPU controls are usable before attachment. */
  public initialize(context: EmitterContext): void {
    this.assertAlive();
    if (this.context) {
      if (this.context.gl !== context.gl) {
        throw new Error('An emitter cannot move between WebGL contexts');
      }
      return;
    }
    const simulation = new GpuSimulation(context, this.width, this.rows, this.capacity);
    this.simulation = simulation;
    try {
      // Compile both paths without changing playback, seeds, or queued controls.
      simulation.reset();
      this.integrate(0, 0, this.initial.lifetime.at(0), 0);
      this.integrate(0, 0, this.initial.lifetime.at(0), 0);
      simulation.reset();
      this.context = context;
    } catch (error) {
      simulation.destroy();
      this.simulation = null;
      throw error;
    }
  }

  public get initialized(): boolean {
    return this.simulation !== null;
  }

  public get gl(): WebGL2RenderingContext {
    if (!this.context) {
      throw new Error('Emitter GPU resources have not been initialized');
    }
    return this.context.gl;
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
      this.simulation?.clear();
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
    if (!this.simulation) {
      throw new Error('Emitter GPU resources have not been initialized');
    }
    return this.simulation.texture;
  }

  /**
   * Advance by 0–0.1 seconds. The first positive step runs pending prewarm first.
   * Before initialize(), updates leave playback paused without accumulating time.
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
    if (!this.simulation || this.state === 'sleeping') {
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
    this.simulation?.reset();
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
    this.simulation?.destroy();
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
    const parameters = this.simulationParameters;
    parameters.step.seconds = seconds;
    parameters.step.birthCount = birthCount;
    parameters.step.seed = this.seed;

    parameters.emission.speed = this.initial.speed.at(emitterAge);
    parameters.emission.direction = settings.initial.direction;
    parameters.emission.spread = settings.initial.spread;
    parameters.emission.lifetime = lifetime;

    parameters.shape.type = this.shape.type;
    parameters.shape.dimensionX = this.shape.dimensionX.at(emitterAge);
    parameters.shape.dimensionY = this.shape.dimensionY.at(emitterAge);

    parameters.shapeSpread.dimensionX = this.shape.dimensionSpreadX;
    parameters.shapeSpread.dimensionY = this.shape.dimensionSpreadY;

    parameters.appearance.size = this.initial.size.at(emitterAge);
    parameters.appearance.rotation = particleRotation;
    parameters.appearance.stretchX = this.initial.stretchX.at(emitterAge);
    parameters.appearance.stretchY = this.initial.stretchY.at(emitterAge);

    parameters.color.red = this.initial.red.at(emitterAge);
    parameters.color.green = this.initial.green.at(emitterAge);
    parameters.color.blue = this.initial.blue.at(emitterAge);
    parameters.color.alpha = this.initial.alpha.at(emitterAge);

    parameters.motionSpread.speed = settings.initial.speedSpread;
    parameters.motionSpread.lifetime = settings.initial.lifetimeSpread;
    parameters.motionSpread.size = settings.initial.sizeSpread;
    parameters.motionSpread.rotation = settings.initial.rotationSpread;

    parameters.colorSpread.red = settings.initial.redSpread;
    parameters.colorSpread.green = settings.initial.greenSpread;
    parameters.colorSpread.blue = settings.initial.blueSpread;
    parameters.colorSpread.alpha = settings.initial.alphaSpread;

    parameters.geometrySpread.angularVelocity = settings.initial.angularVelocitySpread;
    parameters.geometrySpread.stretchX = settings.initial.stretchXSpread;
    parameters.geometrySpread.stretchY = settings.initial.stretchYSpread;

    parameters.position.x = worldSpace ? this.worldX : 0;
    parameters.position.y = worldSpace ? this.worldY : 0;
    parameters.position.inheritedVelocityX = worldSpace
      ? this.velocity.x * settings.inheritVelocity
      : 0;
    parameters.position.inheritedVelocityY = worldSpace
      ? this.velocity.y * settings.inheritVelocity
      : 0;

    parameters.transform.cosine = Math.cos(radians);
    parameters.transform.sine = Math.sin(radians);
    parameters.transform.scale = scale;
    parameters.transform.handedness = handedness;

    parameters.orientation.direction = settings.orientation === 'initial-direction' ? 1 : 0;
    parameters.orientation.movement = settings.orientation === 'movement-direction' ? 1 : 0;
    parameters.orientation.angularVelocity = settings.orientation === 'angular-velocity' ? 1 : 0;
    parameters.orientation.initialAngularVelocity = this.initial.angularVelocity.at(emitterAge);

    parameters.spawnMask = this.slots.spawnMask;
    parameters.rotationCurve = this.rotationSamples;
    parameters.angularVelocityCurve = this.angularVelocitySamples;
    parameters.modifiers = this.modifiers.sample(
      this.playback.modifierAge,
      !worldSpace,
      this.x,
      this.y,
      settings.rotation,
      settings.scale,
      this.effectTransform,
    );
    this.simulation!.update(parameters);
  }

  private assertAlive(): void {
    if (this.disposed) {
      throw new Error('Emitter has been destroyed');
    }
  }
}
