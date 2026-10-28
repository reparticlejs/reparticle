import type { SimulationParameters } from '#types/simulation.js';

import { UniformBuffer } from './uniform-buffer';

// Argument indexes, not byte offsets into a GPU buffer. Keep this order aligned with
// INPUT_ARGUMENTS in simulation/data-layout.ts: backends use the generated metadata
// to locate these values. Slots 1–12 each hold a vec4; later slots hold larger arrays.
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
 * Convert one simulation step's named parameters into the ordered inputs used by
 * both WebGL2 and WebGPU. This is CPU-side packing only: it does not allocate GPU
 * resources, bind textures, upload data, or advance particles.
 *
 * Small parameter groups use reusable four-number buffers. State, spawn masks,
 * sampled curves, and modifier arrays are borrowed from the caller. Each backend
 * uploads these values into its own resources using the generated input layout.
 */
export class SimulationInputs {
  /**
   * Reused argument list, populated by write(). Entries are borrowed, not snapshots:
   * consume them before the next write() and do not modify their contents.
   */
  public readonly args: ({ texture: unknown } | ArrayLike<number>)[] = new Array(
    ARGUMENT_COUNT,
  ).fill(0);
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
   * Pack a step and retain a reference to its previous particle-state texture.
   * Zeroes pad unused vec4 components; they are not additional particle settings.
   * UniformBuffer reuses its existing arrays, swapping them when values change.
   * The state wrapper is opaque here because its texture belongs to either backend.
   */
  public write(state: { texture: unknown }, parameters: SimulationParameters): void {
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

    // Borrow CPU arrays directly. Backends upload the spawn mask as a texture and
    // curves/modifiers as uniform data; these arrays are not GPU textures themselves.
    this.args[ARGUMENT.spawnMask] = parameters.spawnMask;
    this.args[ARGUMENT.rotationCurve] = parameters.rotationCurve;
    this.args[ARGUMENT.angularVelocityCurve] = parameters.angularVelocityCurve;
    this.args[ARGUMENT.modifiers] = parameters.modifiers;
  }
}
