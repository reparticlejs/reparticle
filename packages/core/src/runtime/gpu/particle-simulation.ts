import shaders from '#simulation/shaders.json';
import type { DataTexture } from '#types/data-texture.js';
import type { EmitterContext, PipelineTexture } from '#types/emitter.js';
import type {
  SimulationBinding,
  SharedSimulationProgram,
  SimulationTarget,
  SimulationUniformLayout,
} from '#types/simulation-program.js';
import type { SimulationParameters } from '#types/simulation.js';

import { SimulationInputs } from './inputs';
import { acquireSimulationProgram, releaseSimulationProgram } from './shared-program';

const layouts: Record<string, SimulationUniformLayout> = shaders.layout;
const TEXTURE_UNIT = { state: 0, spawnMask: 1, birth: 2 } as const;

/**
 * Owns two changing-state textures, one birth-data texture and per-emitter inputs.
 * GLSL is generated during the package build; the device compiles and links it.
 * Two state targets alternate as input/output for changing particle state.
 * A separate birth target stores birth properties and is updated only when particles are spawned.
 * The renderer borrows the latest textures directly; no CPU readback is needed.
 *
 * The WebGL context belongs to the host renderer. Calls change its GL bindings
 * and flags; the host must restore rendering state afterward. Reset before the
 * first update, and destroy this instance before destroying the context.
 */
export class GpuSimulation {
  private readonly gl: WebGL2RenderingContext;
  private readonly height: number;
  private readonly maxSize: number;
  private readonly inputs = new SimulationInputs();
  private readonly uniformData = new Float32Array(shaders.words);
  private uniformUploaded = false;
  private readonly textures: WebGLTexture[] = [];
  private readonly framebuffers: WebGLFramebuffer[] = [];
  private spawnMask!: DataTexture;
  private initialState!: SimulationTarget;
  private readState!: SimulationTarget;
  private writeState!: SimulationTarget;
  private birthState!: SimulationTarget;
  private disposed = false;
  private shared: SharedSimulationProgram | null = null;
  private program!: WebGLProgram;
  private bindings: SimulationBinding[] = [];
  private vao: WebGLVertexArrayObject | null = null;
  private uniformBuffer: WebGLBuffer | null = null;
  private output!: PipelineTexture;

  /**
   * Allocate storage for one emitter and acquire the context's shared program.
   * Width and rows address particle slots; each texture stacks two or three bands.
   * Any allocation failure releases resources already created by this instance.
   */
  public constructor(
    context: EmitterContext,
    private readonly width: number,
    private readonly rows: number,
    private readonly capacity: number,
  ) {
    this.gl = context.gl;
    this.height = rows * 2;
    const gl = this.gl;
    if (
      typeof gl.drawArraysInstanced !== 'function' ||
      !gl.getExtension('EXT_color_buffer_float')
    ) {
      throw Error('Missing float render targets');
    }
    this.maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    if (width > this.maxSize || rows * 3 > this.maxSize) {
      throw Error('Capacity exceeds GPU texture limits');
    }
    try {
      this.shared = acquireSimulationProgram(gl);
      this.program = this.shared.program;
      this.bindings = this.shared.bindings;
      this.vao = gl.createVertexArray();
      if (!this.vao) {
        throw new Error('Unable to allocate simulation VAO');
      }
      this.uniformBuffer = gl.createBuffer();
      if (!this.uniformBuffer) {
        throw new Error('Uniform buffer allocation failed');
      }
      if (this.uniformData.byteLength > gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE)) {
        throw new Error('Input block exceeds GPU limit');
      }
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.uniformBuffer);
      gl.bufferData(gl.UNIFORM_BUFFER, this.uniformData.byteLength, gl.DYNAMIC_DRAW);
      this.initialState = this.createTarget(this.height);
      this.readState = this.initialState;
      this.writeState = this.createTarget(this.height);
      this.birthState = this.createTarget(rows * 3);
      // The mask size is known on the first update.
      this.spawnMask = {
        texture: this.createTexture(),
        data: new Float32Array(0),
        width: 0,
        height: 0,
      };
    } catch (e) {
      this.destroy();
      throw e;
    }
  }

  /** Borrowed birth properties; callers must not delete or write this texture. */
  public get birthTexture(): WebGLTexture {
    return this.birthState.texture;
  }

  /** Borrowed current state. Its handle alternates after each successful update. */
  public get texture() {
    return this.output.texture;
  }

  /**
   * Empty particle storage and restore the initial read/write targets.
   * The other state target is fully overwritten by the next update.
   * CPU playback clocks and slot allocation are managed by the owning emitter.
   */
  public clear() {
    try {
      this.prepare();
      this.bindTarget(this.birthState);
      this.gl.clearBufferfv(this.gl.COLOR, 0, new Float32Array(4));
      this.bindTarget(this.initialState);
      this.gl.clearBufferfv(this.gl.COLOR, 0, new Float32Array(4));
      if (this.readState !== this.initialState) {
        this.writeState = this.readState;
        this.readState = this.initialState;
      }
      this.output = { texture: this.readState.texture, context: this.gl };
    } finally {
      this.finish();
    }
  }

  /** Restore empty storage and the initial ping-pong order; keep allocations. */
  public reset() {
    this.clear();
  }

  /**
   * Upload CPU inputs, write new birth properties when needed, then advance state.
   * Births run first so the state pass can read their freshly written properties.
   * Publish the output texture only after both passes have been submitted.
   */
  public update(parameters: SimulationParameters) {
    this.inputs.write(this.output, parameters);
    try {
      this.prepare();
      this.gl.useProgram(this.program);
      this.uploadInputs();
      this.uploadSpawnMask(parameters);
      this.bindInputs();
      if (parameters.step.birthCount > 0) {
        this.drawBirthPass();
      }
      this.drawStatePass();
      this.output = { texture: this.writeState.texture, context: this.gl };
      const previousState = this.readState;
      this.readState = this.writeState;
      this.writeState = previousState;
    } finally {
      this.finish();
    }
  }

  /** Release owned GPU storage once, then release our share of the program. */
  public destroy() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    const gl = this.gl;
    for (const texture of this.textures) {
      if (gl.isTexture(texture)) {
        gl.deleteTexture(texture);
      }
    }
    if (this.uniformBuffer && gl.isBuffer(this.uniformBuffer)) {
      gl.deleteBuffer(this.uniformBuffer);
    }
    releaseSimulationProgram(gl, this.shared);
    this.shared = null;
    if (this.vao && gl.isVertexArray(this.vao)) {
      gl.deleteVertexArray(this.vao);
    }
    for (const framebuffer of this.framebuffers) {
      if (gl.isFramebuffer(framebuffer)) {
        gl.deleteFramebuffer(framebuffer);
      }
    }
  }

  /** Pack changed uniform words and upload their enclosing range. */
  private uploadInputs() {
    const gl = this.gl;
    // Upload only the enclosing range of changed uniform words. The first
    // upload includes zeroes too: newly allocated GPU storage is not assumed valid.
    let firstChanged = this.uniformUploaded ? this.uniformData.length : 0;
    let lastChanged = this.uniformUploaded ? -1 : this.uniformData.length - 1;
    for (const binding of this.bindings) {
      const input = this.inputs.args[binding.index]!;
      const value = 'texture' in input ? null : input;
      const layout = layouts[binding.name];
      if (!layout || !value) {
        continue;
      }
      // Only active modifier records are consumed by the shader. Preserve
      // trailing storage and inspect it when a later count makes it active.
      const length =
        binding.name === 'modifiers'
          ? Math.min(
              value.length,
              shaders.modifierHeader + Math.max(0, Math.ceil(value[0]!)) * shaders.modifierStride,
            )
          : value.length;
      if (value.length > layout.length) {
        throw new Error('Input exceeds generated uniform layout');
      }
      for (let i = 0; i < length; i++) {
        const index = layout.offset + i;
        const word = Math.fround(value[i]!);
        if (!Object.is(this.uniformData[index], word)) {
          this.uniformData[index] = word;
          firstChanged = Math.min(firstChanged, index);
          lastChanged = Math.max(lastChanged, index);
        }
      }
    }
    if (lastChanged >= firstChanged) {
      gl.bindBuffer(gl.UNIFORM_BUFFER, this.uniformBuffer);
      gl.bufferSubData(
        gl.UNIFORM_BUFFER,
        firstChanged * 4,
        this.uniformData,
        firstChanged,
        lastChanged - firstChanged + 1,
      );
      this.uniformUploaded = true;
    }
  }

  /** Upload four packed spawn-mask words per texel, only when their values change. */
  private uploadSpawnMask(parameters: SimulationParameters) {
    const gl = this.gl;
    const mask = parameters.spawnMask;
    const target = this.spawnMask;
    const texelCount = Math.max(1, Math.ceil(mask.length / 4));
    const width = Math.min(this.maxSize, texelCount);
    const height = Math.ceil(texelCount / width);
    this.bindTexture(TEXTURE_UNIT.spawnMask, target.texture);

    if (target.width !== width || target.height !== height) {
      target.data = new Float32Array(width * height * 4);
      target.uploaded = false;
      target.width = width;
      target.height = height;
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    }

    // Old mask bits are ignored on steps without births.
    let changed = !target.uploaded;
    if (parameters.step.birthCount > 0) {
      for (let index = 0; index < mask.length; index++) {
        const word = Math.fround(mask[index]!);
        if (!Object.is(target.data[index], word)) {
          target.data[index] = word;
          changed = true;
        }
      }
    }
    if (changed) {
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RGBA, gl.FLOAT, target.data);
      target.uploaded = true;
    }
  }

  /** Select this emitter's inputs; cached uniforms belong to the shared program. */
  private bindInputs() {
    const gl = this.gl;
    // These uniforms belong to the shared program, not the simulation instance.
    const shared = this.shared!;
    if (
      shared.uploadedWidth !== this.width ||
      shared.uploadedHeight !== this.height ||
      shared.uploadedCapacity !== this.capacity
    ) {
      gl.uniform1i(shared.widthLocation, this.width);
      gl.uniform1i(shared.rowsLocation, this.rows);
      gl.uniform1i(shared.capacityLocation, this.capacity);
      shared.uploadedWidth = this.width;
      shared.uploadedHeight = this.height;
      shared.uploadedCapacity = this.capacity;
    }

    this.bindTexture(TEXTURE_UNIT.state, this.readState.texture);
    for (const binding of this.bindings) {
      if (binding.name !== 'state' && binding.name !== 'spawnMask') {
        continue;
      }
      const unit = TEXTURE_UNIT[binding.name];
      if (binding.unit !== unit) {
        gl.uniform1i(binding.location, unit);
        binding.unit = unit;
      }
    }
    if (!shared.birthSamplerSet) {
      gl.uniform1i(shared.birthState, TEXTURE_UNIT.birth);
      shared.birthSamplerSet = true;
    }
    // Always rebind: another emitter may have used the context since our last update.
    gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.uniformBuffer);
  }

  /** Discard unflagged slots so existing birth properties survive. */
  private drawBirthPass() {
    const gl = this.gl;
    const shared = this.shared!;
    this.bindTarget(this.birthState);
    // Even an unused sampler must not reference the current render attachment.
    this.bindTexture(TEXTURE_UNIT.birth, this.readState.texture);
    gl.uniform1i(shared.birthPass, 1);
    shared.pass = 1;
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Read the previous state and birth data, writing the other state target. */
  private drawStatePass() {
    const gl = this.gl;
    const shared = this.shared!;
    this.bindTarget(this.writeState);
    this.bindTexture(TEXTURE_UNIT.birth, this.birthState.texture);
    if (shared.pass !== 0) {
      gl.uniform1i(shared.birthPass, 0);
      shared.pass = 0;
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Allocate a data texture: nearest filtering prevents interpolation of state. */
  private createTexture() {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw Error('Texture allocation failed');
    }
    this.textures.push(texture);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  /** Allocate a permanent framebuffer attachment; register resources for failure cleanup. */
  private createTarget(height: number): SimulationTarget {
    const gl = this.gl;
    const texture = this.createTexture();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, this.width, height, 0, gl.RGBA, gl.FLOAT, null);
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) {
      throw new Error('Framebuffer allocation failed');
    }
    this.framebuffers.push(framebuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error('Incomplete framebuffer');
    }
    return { texture, framebuffer, height };
  }

  private bindTarget(target: SimulationTarget) {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, target.framebuffer);
    this.gl.viewport(0, 0, this.width, target.height);
  }

  private bindTexture(unit: number, texture: WebGLTexture) {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindSampler(unit, null);
    gl.bindTexture(gl.TEXTURE_2D, texture);
  }

  /** Disable drawing features that would corrupt particle data. */
  private prepare() {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    for (const flag of [gl.BLEND, gl.DEPTH_TEST, gl.STENCIL_TEST, gl.SCISSOR_TEST, gl.CULL_FACE]) {
      gl.disable(flag);
    }
    gl.colorMask(true, true, true, true);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }

  /** Unbind our draw targets, including on failure. The host restores all other GL state. */
  private finish() {
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
