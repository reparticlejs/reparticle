import type { KernelVariable } from 'gpu.js';

import type { PipelineTexture } from '#types/emitter.js';
import type { SimulationParameters } from '#types/simulation.js';

import { UniformBuffer } from './uniform-buffer';

// Positional boundary required by GPU.js. Keep this order aligned with integrate()
// and the argument types in arguments.ts. Each uniform occupies one vec4.
const ARGUMENT = {
  state: 0,
  step: 1,
  emission: 2,
  shape: 3,
  shapeSpread: 4,
  appearance: 5,
  color: 6,
  motionSpread: 7,
  colorSpread: 8,
  geometrySpread: 9,
  position: 10,
  transform: 11,
  orientation: 12,
  spawnMask: 13,
  rotationCurve: 14,
  angularVelocityCurve: 15,
  modifiers: 16,
} as const;
const ARGUMENT_COUNT = ARGUMENT.modifiers + 1;

/**
 * Pack named parameters into reusable vec4 uniforms for one update kernel.
 * Each kernel owns its buffers because GPU.js caches the last uploaded array
 * by reference. Never share an instance between the alternating update kernels.
 * UniformBuffer preserves those cached references until their values change.
 *
 * The final four inputs are texture-backed arrays. Forward them without copying;
 * their storage and upload behavior are owned by the existing simulation code.
 */
export class SimulationInputs {
  /** Borrowed kernel arguments; call write() before the first run. Reused each step. */
  public readonly args: KernelVariable[] = new Array(ARGUMENT_COUNT).fill(0);
  private readonly step = new UniformBuffer();
  private readonly emission = new UniformBuffer();
  private readonly shape = new UniformBuffer();
  private readonly shapeSpread = new UniformBuffer();
  private readonly appearance = new UniformBuffer();
  private readonly color = new UniformBuffer();
  private readonly motionSpread = new UniformBuffer();
  private readonly colorSpread = new UniformBuffer();
  private readonly geometrySpread = new UniformBuffer();
  private readonly position = new UniformBuffer();
  private readonly transform = new UniformBuffer();
  private readonly orientation = new UniformBuffer();

  /**
   * Update named groups in place and bind the previous particle-state texture.
   * Zeroes pad unused vec4 components; they are not additional particle settings.
   * Buffer selection may change, but neither buffers nor the argument list are
   * allocated here. This prepares inputs only; the kernel performs the uploads.
   */
  public write(state: PipelineTexture, parameters: SimulationParameters): void {
    const {
      step,
      emission,
      shape,
      shapeSpread,
      appearance,
      color,
      motionSpread,
      colorSpread,
      geometrySpread,
      position,
      transform,
      orientation,
    } = parameters;

    this.args[ARGUMENT.state] = state;
    this.args[ARGUMENT.step] = this.step.set(step.seconds, step.birthCount, step.seed, 0);
    this.args[ARGUMENT.emission] = this.emission.set(
      emission.speed,
      emission.direction,
      emission.spread,
      emission.lifetime,
    );
    this.args[ARGUMENT.shape] = this.shape.set(shape.type, shape.dimensionX, shape.dimensionY, 0);
    this.args[ARGUMENT.shapeSpread] = this.shapeSpread.set(
      shapeSpread.dimensionX,
      shapeSpread.dimensionY,
      0,
      0,
    );
    this.args[ARGUMENT.appearance] = this.appearance.set(
      appearance.size,
      appearance.rotation,
      appearance.stretchX,
      appearance.stretchY,
    );
    this.args[ARGUMENT.color] = this.color.set(color.red, color.green, color.blue, color.alpha);
    this.args[ARGUMENT.motionSpread] = this.motionSpread.set(
      motionSpread.speed,
      motionSpread.lifetime,
      motionSpread.size,
      motionSpread.rotation,
    );
    this.args[ARGUMENT.colorSpread] = this.colorSpread.set(
      colorSpread.red,
      colorSpread.green,
      colorSpread.blue,
      colorSpread.alpha,
    );
    this.args[ARGUMENT.geometrySpread] = this.geometrySpread.set(
      geometrySpread.angularVelocity,
      geometrySpread.stretchX,
      geometrySpread.stretchY,
      0,
    );
    this.args[ARGUMENT.position] = this.position.set(
      position.x,
      position.y,
      position.inheritedVelocityX,
      position.inheritedVelocityY,
    );
    this.args[ARGUMENT.transform] = this.transform.set(
      transform.cosine,
      transform.sine,
      transform.scale,
      transform.handedness,
    );
    this.args[ARGUMENT.orientation] = this.orientation.set(
      orientation.direction,
      orientation.movement,
      orientation.angularVelocity,
      orientation.initialAngularVelocity,
    );

    // Existing texture inputs are borrowed, never cloned.
    this.args[ARGUMENT.spawnMask] = parameters.spawnMask;
    this.args[ARGUMENT.rotationCurve] = parameters.rotationCurve;
    this.args[ARGUMENT.angularVelocityCurve] = parameters.angularVelocityCurve;
    this.args[ARGUMENT.modifiers] = parameters.modifiers;
  }
}
