import type { KernelVariable } from 'gpu.js';

import type { PipelineTexture } from '#types/emitter.js';
import type { SimulationParameters } from '#types/simulation.js';

import { UniformBuffer } from './uniform-buffer';

/**
 * Pack named parameters into reusable vec4 uniforms for one update kernel.
 * Each kernel owns its buffers because GPU.js caches the last uploaded array
 * by reference. Texture inputs retain their original arrays and upload paths.
 */
export class SimulationInputs {
  public readonly args: KernelVariable[] = new Array(17).fill(0);
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

  /** Fill existing buffers and the argument array without allocating per step. */
  public write(state: PipelineTexture, parameters: SimulationParameters): void {
    this.args[0] = state;
    this.args[1] = this.step.set(
      parameters.step.seconds,
      parameters.step.birthCount,
      parameters.step.seed,
      0,
    );
    this.args[2] = this.emission.set(
      parameters.emission.speed,
      parameters.emission.direction,
      parameters.emission.spread,
      parameters.emission.lifetime,
    );
    this.args[3] = this.shape.set(
      parameters.shape.type,
      parameters.shape.dimensionX,
      parameters.shape.dimensionY,
      0,
    );
    this.args[4] = this.shapeSpread.set(
      parameters.shapeSpread.dimensionX,
      parameters.shapeSpread.dimensionY,
      0,
      0,
    );
    this.args[5] = this.appearance.set(
      parameters.appearance.size,
      parameters.appearance.rotation,
      parameters.appearance.stretchX,
      parameters.appearance.stretchY,
    );
    this.args[6] = this.color.set(
      parameters.color.red,
      parameters.color.green,
      parameters.color.blue,
      parameters.color.alpha,
    );
    this.args[7] = this.motionSpread.set(
      parameters.motionSpread.speed,
      parameters.motionSpread.lifetime,
      parameters.motionSpread.size,
      parameters.motionSpread.rotation,
    );
    this.args[8] = this.colorSpread.set(
      parameters.colorSpread.red,
      parameters.colorSpread.green,
      parameters.colorSpread.blue,
      parameters.colorSpread.alpha,
    );
    this.args[9] = this.geometrySpread.set(
      parameters.geometrySpread.angularVelocity,
      parameters.geometrySpread.stretchX,
      parameters.geometrySpread.stretchY,
      0,
    );
    this.args[10] = this.position.set(
      parameters.position.x,
      parameters.position.y,
      parameters.position.inheritedVelocityX,
      parameters.position.inheritedVelocityY,
    );
    this.args[11] = this.transform.set(
      parameters.transform.cosine,
      parameters.transform.sine,
      parameters.transform.scale,
      parameters.transform.handedness,
    );
    this.args[12] = this.orientation.set(
      parameters.orientation.direction,
      parameters.orientation.movement,
      parameters.orientation.angularVelocity,
      parameters.orientation.initialAngularVelocity,
    );
    this.args[13] = parameters.spawnMask;
    this.args[14] = parameters.rotationCurve;
    this.args[15] = parameters.angularVelocityCurve;
    this.args[16] = parameters.modifiers;
  }
}
