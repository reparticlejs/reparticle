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
import { BurstSchedule } from './playback/burst-schedule';
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
  private initialProperties: InitialPropertyCurves;
  private spawnRate: SpawnRate;
  private shape: SampledShape;
  private readonly angularVelocitySamples: Float32Array;
  private readonly rotationSamples: Float32Array;

  // Playback, birth allocation, and inherited motion.
  private readonly playback: EmitterPlayback;
  private readonly burstSchedule: BurstSchedule;
  private readonly spawnSchedule: SpawnSchedule;
  private readonly particleSlots: ParticleSlots;
  private readonly emitterVelocity = new EmitterVelocity();
  private spawnSeed: number;
  private readonly initialSeed: number;
  private needsPrewarm = true;
  private pendingBurstCount = 0;

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
    this.initialProperties = sampleInitialProperties(this.settings.initial);
    this.angularVelocitySamples = sampleCurve(this.settings.overLifetime.angularVelocity);
    this.rotationSamples = sampleCurve(
      this.settings.orientation === 'angular-velocity' ? 0 : this.settings.overLifetime.rotation,
    );
    this.shape = new SampledShape(this.settings.emission.shape);

    this.capacity = this.settings.capacity;
    this.rows = Math.ceil(this.capacity / this.width);

    this.burstSchedule = new BurstSchedule(
      this.settings.emission.bursts,
      this.capacity,
      this.settings.seed,
    );
    this.spawnSchedule = new SpawnSchedule(this.capacity);
    this.particleSlots = new ParticleSlots(this.capacity, true);
    this.playback = new EmitterPlayback(
      this.settings.duration,
      this.settings.playMode,
      this.settings.startDelay,
      this.settings,
    );

    this.initialSeed = this.settings.seed;
    this.spawnSeed = this.initialSeed;
    if (!Number.isFinite(this.spawnSeed)) {
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
    context.assertAvailable?.();
    try {
      const simulation = new GpuSimulation(context, this.width, this.rows, this.capacity);
      this.simulation = simulation;
      try {
        // Compile both paths without changing playback, seeds, or queued controls.
        simulation.reset();
        this.integrate(0, 0, this.initialProperties.lifetime.at(0), 0);
        this.integrate(0, 0, this.initialProperties.lifetime.at(0), 0);
        simulation.reset();
        this.context = context;
      } catch (error) {
        simulation.destroy();
        this.simulation = null;
        throw error;
      }
    } finally {
      context.restoreState?.();
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
    this.context?.assertAvailable?.();
    this.emitting = true;
    this.reset();
  }

  /**
   * Queue an explicit particle count for the next positive update, after prewarm.
   * Bypasses the emission gate, delay, and scheduled burst probability. Requests
   * share available slots with scheduled births; overflow is dropped, never retried.
   * Multiple calls accumulate up to capacity. Zero is a no-op; stop/reset cancel them.
   */
  public emitBurst(count: number): void {
    this.assertAlive();
    this.context?.assertAvailable?.();
    if (!Number.isSafeInteger(count) || count < 0) {
      throw new RangeError('Burst count must be a nonnegative safe integer');
    }
    this.pendingBurstCount = Math.min(this.capacity, this.pendingBurstCount + count);
  }

  /** Finish the current cycle, then drain existing particles. */
  public retire(): void {
    this.assertAlive();
    this.playback.retire();
  }

  /** Stop spawning; existing particles drain unless clear is requested. */
  public stop({ clear = false }: StopOptions = {}): void {
    this.assertAlive();
    this.context?.assertAvailable?.();
    if (clear) {
      try {
        this.simulation?.clear();
      } finally {
        this.context?.restoreState?.();
      }
      this.particleSlots.reset();
    }
    this.needsPrewarm = false;
    this.pendingBurstCount = 0;
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
    let modifiers = this.modifiers;
    let shape = this.shape;
    let spawnRate = this.spawnRate;

    if (patch.modifiers !== undefined) {
      modifiers = new ModifierSampler(settings.modifiers, this.sharedModifiers);
    }
    if (patch.emission?.shape !== undefined) {
      shape = new SampledShape(settings.emission.shape);
    }
    if (patch.emission?.rate !== undefined) {
      spawnRate = new SpawnRate(
        settings.emission.rate,
        settings.emission.rateSpread,
        settings.seed,
      );
    }
    const initial = sampleInitialProperties(
      settings.initial,
      this.initialProperties,
      patch.initial,
    );

    // Commit only after every replacement has been validated and sampled.
    this.settings = settings;
    this.modifiers = modifiers;
    this.shape = shape;
    this.initialProperties = initial;
    this.spawnRate = spawnRate;
  }

  /** Changes when allocation or particle ages change, including reset and clear. */
  public get particleRevision(): number {
    return this.particleSlots.revision;
  }

  /** Copy the final logical order; simulation texels always remain in their original slots. */
  public copyParticleOrder(target: Uint32Array): number {
    this.assertAlive();
    return this.particleSlots.copyOrder(target);
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
    this.context?.assertAvailable?.();
    if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) {
      throw new RangeError('Emitter position must be finite');
    }
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 0.1) {
      throw new RangeError('Step must be between 0 and 0.1 seconds');
    }
    if (!this.simulation || (this.state === 'sleeping' && this.pendingBurstCount === 0)) {
      return;
    }
    try {
      if (seconds > 0 && this.needsPrewarm) {
        this.needsPrewarm = false;
        prewarm(
          this.settings.startOffset,
          this.initialProperties.lifetime.maximum + this.settings.initial.lifetimeSpread,
          (stepSeconds) => this.step(stepSeconds),
        );
      }
      this.emitterVelocity.update(this.worldX, this.worldY, seconds);
      const manualBirths = seconds > 0 ? this.pendingBurstCount : 0;
      if (seconds > 0) {
        this.pendingBurstCount = 0;
      }
      this.step(seconds, manualBirths);
    } finally {
      this.context?.restoreState?.();
    }
    this.notifyStateChanges();
  }

  /** Clear particles and restore the initial clock and seed; preserve the emitting gate. */
  public reset(): void {
    this.assertAlive();
    this.context?.assertAvailable?.();
    try {
      this.simulation?.reset();
    } finally {
      this.context?.restoreState?.();
    }
    this.pendingBurstCount = 0;
    this.spawnSchedule.reset();
    this.burstSchedule.reset();
    this.particleSlots.reset();
    this.playback.reset();
    this.emitterVelocity.reset();
    this.needsPrewarm = true;
    this.spawnSeed = this.initialSeed;
    this.notifyStateChanges();
  }

  /** Release owned resources once, leaving the shared WebGL context alive. */
  public destroy(): void {
    if (this.disposed) {
      return;
    }
    this.context?.assertAvailable?.();
    this.disposed = true;
    this.listeners.clear();
    try {
      this.simulation?.destroy();
    } finally {
      this.context?.restoreState?.();
    }
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
  private step(seconds: number, manualBirths = 0): void {
    if (manualBirths > 0) {
      this.playback.wake();
    }
    if (this.state === 'sleeping') {
      return;
    }
    const shouldEmit = this.playback.advance(seconds);
    const emitterAge = this.playback.normalizedAge;
    const rate = shouldEmit && this.emitting ? this.spawnRate.at(emitterAge) : 0;
    const continuousBirths = this.spawnSchedule.next(rate, seconds);
    const burstBirths = shouldEmit
      ? this.burstSchedule.next(this.playback.emissionCycle, this.playback.emissionTime)
      : 0;
    const requested = Math.min(
      this.capacity,
      continuousBirths + (this.emitting ? burstBirths : 0) + manualBirths,
    );
    const lifetime = this.initialProperties.lifetime.at(emitterAge);
    const settings = this.settings;

    const birthCount = this.particleSlots.advance(
      seconds,
      requested,
      lifetime,
      settings.initial.lifetimeSpread,
      this.spawnSeed,
      Math.max(0, this.initialProperties.lifetime.maximum),
    );

    this.integrate(seconds, birthCount, lifetime, emitterAge);

    if (seconds > 0) {
      this.playback.finish(this.particleSlots.empty);
    }
    if (birthCount > 0) {
      this.spawnSeed = (this.spawnSeed + 1) % 65536;
    }
  }

  /** Fill reusable input groups, then run one GPU pass. No particle data returns to the CPU. */
  private integrate(
    seconds: number,
    birthCount: number,
    lifetime: number,
    emitterAge: number,
  ): void {
    const parameters = this.simulationParameters;
    parameters.step.seconds = seconds;
    parameters.step.birthCount = birthCount;
    parameters.step.seed = this.spawnSeed;

    this.sampleBirthProperties(emitterAge, lifetime);
    this.copyBirthSpread();
    this.prepareBirthTransform(emitterAge);
    this.sampleModifiers();

    parameters.spawnMask = this.particleSlots.spawnMask;
    parameters.rotationCurve = this.rotationSamples;
    parameters.angularVelocityCurve = this.angularVelocitySamples;
    this.simulation!.update(parameters);
  }

  /** Birth properties use the emitter's normalized age, not each particle's age. */
  private sampleBirthProperties(emitterAge: number, lifetime: number): void {
    const settings = this.settings;
    const parameters = this.simulationParameters;
    parameters.emission.speed = this.initialProperties.speed.at(emitterAge);
    parameters.emission.direction = settings.initial.direction;
    parameters.emission.spread = settings.initial.spread;
    parameters.emission.lifetime = lifetime;

    parameters.shape.type = this.shape.type;
    parameters.shape.dimensionX = this.shape.dimensionX.at(emitterAge);
    parameters.shape.dimensionY = this.shape.dimensionY.at(emitterAge);

    parameters.shapeSpread.dimensionX = this.shape.dimensionSpreadX;
    parameters.shapeSpread.dimensionY = this.shape.dimensionSpreadY;

    parameters.appearance.size = this.initialProperties.size.at(emitterAge);
    parameters.appearance.stretchX = this.initialProperties.stretchX.at(emitterAge);
    parameters.appearance.stretchY = this.initialProperties.stretchY.at(emitterAge);

    parameters.color.red = this.initialProperties.red.at(emitterAge);
    parameters.color.green = this.initialProperties.green.at(emitterAge);
    parameters.color.blue = this.initialProperties.blue.at(emitterAge);
    parameters.color.alpha = this.initialProperties.alpha.at(emitterAge);

    parameters.orientation.direction = settings.orientation === 'initial-direction' ? 1 : 0;
    parameters.orientation.movement = settings.orientation === 'movement-direction' ? 1 : 0;
    parameters.orientation.angularVelocity = settings.orientation === 'angular-velocity' ? 1 : 0;
    parameters.orientation.initialAngularVelocity =
      this.initialProperties.angularVelocity.at(emitterAge);
  }

  /** Spread is copied separately from the sampled base values. */
  private copyBirthSpread(): void {
    const settings = this.settings;
    const parameters = this.simulationParameters;
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
  }

  /** World-space births capture the transform; local-space births follow it when rendered. */
  private prepareBirthTransform(emitterAge: number): void {
    const settings = this.settings;
    const worldSpace = settings.space === 'world';
    const handedness = worldSpace ? this.worldHandedness : 1;
    const scale = worldSpace ? this.worldScale : 1;
    const rotation = worldSpace ? this.worldRotation : 0;
    const radians = (-rotation * Math.PI) / 180;
    const initialRotation = this.initialProperties.rotation.at(emitterAge) * handedness;
    const particleRotation =
      settings.orientation === 'movement-direction' ? initialRotation : initialRotation + rotation;
    const parameters = this.simulationParameters;
    parameters.appearance.rotation = particleRotation;

    parameters.position.x = worldSpace ? this.worldX : 0;
    parameters.position.y = worldSpace ? this.worldY : 0;
    parameters.position.inheritedVelocityX = worldSpace
      ? this.emitterVelocity.x * settings.inheritVelocity
      : 0;
    parameters.position.inheritedVelocityY = worldSpace
      ? this.emitterVelocity.y * settings.inheritVelocity
      : 0;

    parameters.transform.cosine = Math.cos(radians);
    parameters.transform.sine = Math.sin(radians);
    parameters.transform.scale = scale;
    parameters.transform.handedness = handedness;
  }

  /** Modifiers use their own playback clock and the particle simulation's coordinate space. */
  private sampleModifiers(): void {
    const settings = this.settings;
    const parameters = this.simulationParameters;
    const worldSpace = settings.space === 'world';
    parameters.modifiers = this.modifiers.sample(
      this.playback.modifierAge,
      !worldSpace,
      this.x,
      this.y,
      settings.rotation,
      settings.scale,
      this.effectTransform,
    );
  }

  private assertAlive(): void {
    if (this.disposed) {
      throw new Error('Emitter has been destroyed');
    }
  }
}
