import { SimulationInputs } from '#runtime/shared/inputs.js';
import { MODIFIER_HEADER, MODIFIER_STRIDE } from '#simulation/data-layout.js';
import shader from '#simulation/shaders/webgpu.json';
import type { SimulationParameters } from '#types/simulation.js';

import { GPUTextureUsage, GPUBufferUsage } from './constants';
import { getSimulationPipelines } from './shared-pipelines';
import { SimulationSubmissions } from './submissions';

// Map packed argument indexes to offsets in the generated uniform block.
// Offsets count float32 words, not bytes; texture arguments have no uniform entry.
const inputNames = Object.keys(shader.arguments);
const inputLayout = Object.entries(shader.layout).map(([name, layout]) => ({
  index: inputNames.indexOf(name),
  offset: layout.offset,
  modifiers: name === 'modifiers',
}));

/**
 * Own one emitter's GPU storage and submit its birth and motion compute passes.
 * Playback, birth allocation, and parameter sampling remain in the shared emitter.
 *
 * Two state textures alternate as input and output, each holding two RGBA bands.
 * A separate three-band texture holds birth properties until a slot is recycled.
 * Pixi borrows these textures directly; normal updates do not read particles back.
 *
 * The host owns the device. Compute pipelines are shared per device; textures,
 * buffers, and bind groups belong to this instance. The owning emitter resets
 * storage before its first step and destroys it before the host device is released.
 */
export class WebGPUSimulation {
  private readonly shared;
  private readonly states: [GPUTexture, GPUTexture];
  /** Borrowed by the renderer; only this simulation may write or destroy it. */
  private readonly births: GPUTexture;
  private readonly mask: GPUTexture;
  private readonly maskWidth: number;
  private readonly maskData: Float32Array<ArrayBuffer>;
  private readonly uniformBuffer: GPUBuffer;
  private readonly dimensions: GPUBuffer;
  private readonly uniformGroup: GPUBindGroup;
  private readonly birthGroups: GPUBindGroup[];
  private readonly stateGroups: GPUBindGroup[];
  private readonly uniforms = new Float32Array(shader.words);
  private readonly inputs = new SimulationInputs();
  private uniformUploaded = false;
  // Index of the latest submitted state; the other texture receives the next step.
  private current = 0;
  private disposed = false;

  /** Allocate storage and prebuild bindings for both directions of the state swap. */
  public constructor(
    private readonly device: GPUDevice,
    private readonly width: number,
    private readonly rows: number,
    capacity: number,
    private readonly submissions: SimulationSubmissions,
  ) {
    this.shared = getSimulationPipelines(device);
    const texture = (height: number, label: string) =>
      device.createTexture({
        label,
        size: [width, height],
        format: 'rgba32float',
        usage:
          GPUTextureUsage.TEXTURE_BINDING |
          GPUTextureUsage.STORAGE_BINDING |
          GPUTextureUsage.COPY_DST |
          GPUTextureUsage.COPY_SRC,
      });
    this.states = [texture(rows * 2, 'particle state A'), texture(rows * 2, 'particle state B')];
    this.births = texture(rows * 3, 'particle births');
    // Each float stores 24 exact spawn bits; each RGBA texel stores four such words.
    const texels = Math.max(1, Math.ceil(Math.ceil(capacity / 24) / 4));
    this.maskWidth = Math.min(device.limits.maxTextureDimension2D, texels);
    const maskHeight = Math.ceil(texels / this.maskWidth);
    this.maskData = new Float32Array(this.maskWidth * maskHeight * 4);
    this.mask = device.createTexture({
      size: [this.maskWidth, maskHeight],
      format: 'rgba32float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    this.uniformBuffer = device.createBuffer({
      size: this.uniforms.byteLength,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    this.dimensions = device.createBuffer({
      size: 16,
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    // Dimensions never change after allocation. The fourth word pads the uniform to 16 bytes.
    device.queue.writeBuffer(this.dimensions, 0, new Uint32Array([width, rows, capacity, 0]));
    this.uniformGroup = device.createBindGroup({
      layout: this.shared.uniforms,
      entries: [{ binding: 0, resource: { buffer: this.uniformBuffer } }],
    });
    // Binding numbers match group 1 in scripts/shaders/webgpu/simulation.wgsl.
    const group = (state: GPUTexture, birth: GPUTexture, output: GPUTexture) =>
      device.createBindGroup({
        layout: this.shared.textures,
        entries: [
          { binding: 0, resource: state.createView() },
          { binding: 1, resource: this.mask.createView() },
          { binding: 2, resource: birth.createView() },
          { binding: 3, resource: output.createView() },
          { binding: 4, resource: { buffer: this.dimensions } },
        ],
      });
    // The birth pass does not read birth data. Bind state instead to avoid a read/write alias.
    this.birthGroups = this.states.map((state) => group(state, state, this.births));
    this.stateGroups = this.states.map((state, index) =>
      group(state, this.births, this.states[1 - index]!),
    );
  }

  /** Latest submitted state, borrowed by the renderer. Its handle alternates after updates. */
  public get texture(): GPUTexture {
    this.submissions.publish();
    return this.states[this.current]!;
  }

  /** Submit pending writes before a consumer reads the borrowed birth texture. */
  public get birthTexture(): GPUTexture {
    this.submissions.publish();
    return this.births;
  }

  /**
   * Upload this step's inputs, initialize accepted births, then advance every slot.
   * Births run first so motion reads their new properties in the same step.
   *
   * Uploads and compute submissions use the same device queue. Multiple steps in
   * one frame therefore consume their own inputs in order. Returning publishes
   * the output handle; it does not wait for GPU completion. Rendering submitted
   * afterward on that device observes the updated texture.
   */
  public update(parameters: SimulationParameters): void {
    this.submissions.beginStep(this);
    this.inputs.write({ texture: this.states[this.current]! }, parameters);
    let changed = !this.uniformUploaded;
    for (const layout of inputLayout) {
      const input = this.inputs.args[layout.index]!;
      if ('texture' in input) {
        continue;
      }
      if (!changed) {
        // Inactive modifier records are ignored by the shader. Check them when
        // a later count increase makes them live, as the WebGL2 path does.
        const length = layout.modifiers
          ? Math.min(
              input.length,
              MODIFIER_HEADER + Math.max(0, Math.ceil(input[0]!)) * MODIFIER_STRIDE,
            )
          : input.length;
        for (let word = 0; word < length; word++) {
          if (!Object.is(this.uniforms[layout.offset + word], Math.fround(input[word]!))) {
            changed = true;
            break;
          }
        }
      }
      // Once any word changed, an upload is inevitable. Copy the remaining
      // inputs natively rather than comparing every word in a changing frame.
      if (changed) {
        this.uniforms.set(input, layout.offset);
      }
    }
    if (changed) {
      this.device.queue.writeBuffer(this.uniformBuffer, 0, this.uniforms);
      this.uniformUploaded = true;
    }
    // Without births, the shader ignores old mask bits and no upload is needed.
    if (parameters.step.birthCount > 0) {
      this.maskData.set(parameters.spawnMask);
      this.device.queue.writeTexture(
        { texture: this.mask },
        this.maskData,
        { bytesPerRow: this.maskWidth * 16 },
        [this.maskWidth, this.mask.height],
      );
    }
    const encoder = this.submissions.getEncoder();
    const dispatch = (pipeline: GPUComputePipeline, group: GPUBindGroup) => {
      const pass = encoder.beginComputePass();
      pass.setPipeline(pipeline);
      pass.setBindGroup(0, this.uniformGroup);
      pass.setBindGroup(1, group);
      // Both entry points use 8 × 8 workgroups and guard invocations outside the slot grid.
      pass.dispatchWorkgroups(Math.ceil(this.width / 8), Math.ceil(this.rows / 8));
      pass.end();
    };
    if (parameters.step.birthCount > 0) {
      dispatch(this.shared.births, this.birthGroups[this.current]!);
    }
    dispatch(this.shared.advance, this.stateGroups[this.current]!);
    this.current = 1 - this.current;
    this.submissions.endStep();
  }

  /**
   * Empty birth data and the initial state texture, preserving allocations.
   * The next motion pass fully overwrites the other state texture. Playback
   * clocks, seeds, and CPU slot counts are reset separately by the owning emitter.
   */
  public clear(): void {
    this.submissions.flush();
    this.current = 0;
    for (const texture of [this.states[this.current]!, this.births]) {
      this.device.queue.writeTexture(
        { texture },
        new Float32Array(this.width * texture.height * 4),
        { bytesPerRow: this.width * 16 },
        [this.width, texture.height],
      );
    }
  }
  /** Restore empty GPU storage; clearing and resetting are identical at this layer. */
  public reset(): void {
    this.clear();
  }

  /**
   * Release owned textures and buffers once, after the renderer detaches its wrappers.
   * Bind groups need no explicit destruction. The device and its cached pipelines
   * remain available to other effects.
   */
  public destroy(): void {
    if (this.disposed) {
      return;
    }
    this.submissions.flush();
    this.disposed = true;
    for (const texture of [...this.states, this.births, this.mask]) {
      texture.destroy();
    }
    this.uniformBuffer.destroy();
    this.dimensions.destroy();
  }
}
