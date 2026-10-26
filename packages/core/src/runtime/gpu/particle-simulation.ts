// Execute the build-time compiled simulation; programs are shared per WebGL context.
import shaders from '#simulation/shaders.json';
import type { DataTexture } from '#types/data-texture.js';
import type { EmitterContext, PipelineTexture } from '#types/emitter.js';
import type { SimulationBinding, SharedSimulationProgram } from '#types/simulation-program.js';
import type { SimulationParameters } from '#types/simulation.js';

import { SimulationInputs } from './inputs';
import { acquireSimulationProgram, releaseSimulationProgram } from './shared-program';

const layouts: Record<string, { offset: number; length: number; padded: number }> = shaders.layout;

/**
 * Owns two changing-state textures, one birth-data texture and per-emitter inputs.
 * GLSL is generated during the package build; the device compiles and links it.
 * The host restores rendering state after calls. Reset before the first update.
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
  private readonly dataTextures: DataTexture[] = [];
  private disposed = false;
  private shared: SharedSimulationProgram | null = null;
  private program!: WebGLProgram;
  private bindings: SimulationBinding[] = [];
  private vao: WebGLVertexArrayObject | null = null;
  private uniformBuffer: WebGLBuffer | null = null;
  private output!: PipelineTexture;
  private next = 1;

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
      for (let i = 0; i < 3; i++) {
        const t = this.createTexture();
        this.textures.push(t);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA32F,
          width,
          i === 2 ? rows * 3 : this.height,
          0,
          gl.RGBA,
          gl.FLOAT,
          null,
        );
        const fb = gl.createFramebuffer();
        if (!fb) {
          throw new Error('Framebuffer allocation failed');
        }
        this.framebuffers.push(fb);
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0]);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          throw new Error('Incomplete framebuffer');
        }
      }
      for (let i = 0; i < 1; i++) {
        this.dataTextures.push({
          texture: this.createTexture(),
          data: new Float32Array(0),
          width: 0,
          height: 0,
        });
      }
    } catch (e) {
      this.destroy();
      throw e;
    }
  }
  public get birthTexture(): WebGLTexture {
    return this.textures[2]!;
  }
  public get texture() {
    return this.output.texture;
  }
  public clear() {
    try {
      this.prepare(2);
      this.gl.clearBufferfv(this.gl.COLOR, 0, new Float32Array(4));
      this.prepare(0);
      this.gl.clearBufferfv(this.gl.COLOR, 0, new Float32Array(4));
      this.output = { texture: this.textures[0]!, context: this.gl };
      // clear() can be called independently of reset(), at either ping-pong phase.
      this.next = 1;
    } finally {
      this.finish();
    }
  }
  public reset() {
    this.clear();
    this.next = 1;
  }
  public update(parameters: SimulationParameters) {
    const gl = this.gl;
    this.inputs.write(this.output, parameters);
    try {
      this.prepare(this.next);
      gl.useProgram(this.program);
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
      let unit = 0;
      let firstChanged = this.uniformUploaded ? this.uniformData.length : 0;
      let lastChanged = this.uniformUploaded ? -1 : this.uniformData.length - 1;
      for (const binding of this.bindings) {
        const input = this.inputs.args[binding.index]!;
        const value = 'texture' in input ? null : input;
        const layout = layouts[binding.name];
        if (layout && value) {
          // Only active modifier records are consumed by the shader. Preserve
          // trailing storage and inspect it when a later count makes it active.
          const length =
            binding.name === 'modifiers'
              ? Math.min(
                  value.length,
                  shaders.modifierHeader +
                    Math.max(0, Math.ceil(value[0]!)) * shaders.modifierStride,
                )
              : value.length;
          if (value.length > layout.length) {
            throw new Error('Input exceeds generated uniform layout');
          }
          for (let i = 0; i < length; i++) {
            const index = layout.offset + i;
            const next = Math.fround(value[i]!);
            if (!Object.is(this.uniformData[index], next)) {
              this.uniformData[index] = next;
              firstChanged = Math.min(firstChanged, index);
              lastChanged = Math.max(lastChanged, index);
            }
          }
          continue;
        }
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindSampler(unit, null);
        if ('texture' in input) {
          gl.bindTexture(gl.TEXTURE_2D, input.texture);
        } else {
          const spawnMask = input;
          const target = this.dataTextures[binding.index - 13]!;
          const count = Math.max(1, Math.ceil(spawnMask.length / 4));
          const w = Math.min(this.maxSize, count),
            h = Math.ceil(count / w);
          gl.bindTexture(gl.TEXTURE_2D, target.texture);
          if (target.width !== w || target.height !== h) {
            target.data = new Float32Array(w * h * 4);
            target.uploaded = false;
            target.width = w;
            target.height = h;
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, w, h, 0, gl.RGBA, gl.FLOAT, null);
          }
          // Compare spawn-mask contents on births; old bits are ignored when birthCount is zero.
          // Compare float32 values (the texture's actual precision).
          let changed = !target.uploaded;
          for (let i = 0; i < (parameters.step.birthCount > 0 ? spawnMask.length : 0); i++) {
            const v = Math.fround(spawnMask[i]!);
            if (!Object.is(target.data[i], v)) {
              changed = true;
            }
            target.data[i] = v;
          }
          if (changed) {
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, w, h, gl.RGBA, gl.FLOAT, target.data);
            target.uploaded = true;
          }
        }
        if (binding.unit !== unit) {
          gl.uniform1i(binding.location, unit);
          binding.unit = unit;
        }
        unit++;
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
      gl.bindBufferBase(gl.UNIFORM_BUFFER, 0, this.uniformBuffer);
      // State, spawn mask and birth data are the only remaining texture inputs.
      gl.activeTexture(gl.TEXTURE0 + 2);
      gl.bindSampler(2, null);
      if (!shared.birthSamplerSet) {
        gl.uniform1i(shared.birthState, 2);
        shared.birthSamplerSet = true;
      }
      if (parameters.step.birthCount > 0) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[2]!);
        gl.viewport(0, 0, this.width, this.rows * 3);
        // A sampler must not reference its render attachment, even in a dead branch.
        gl.bindTexture(gl.TEXTURE_2D, this.output.texture);
        gl.uniform1i(shared.birthPass, 1);
        shared.pass = 1;
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.next]!);
        gl.viewport(0, 0, this.width, this.height);
      }
      gl.bindTexture(gl.TEXTURE_2D, this.textures[2]!);
      if (shared.pass !== 0) {
        gl.uniform1i(shared.birthPass, 0);
        shared.pass = 0;
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      this.output = { texture: this.textures[this.next]!, context: gl };
      this.next = 1 - this.next;
    } finally {
      this.finish();
    }
  }
  public destroy() {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    const gl = this.gl;
    for (const t of this.textures) {
      if (gl.isTexture(t)) {
        gl.deleteTexture(t);
      }
    }
    for (const t of this.dataTextures) {
      if (gl.isTexture(t.texture)) {
        gl.deleteTexture(t.texture);
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
    for (const fb of this.framebuffers) {
      if (gl.isFramebuffer(fb)) {
        gl.deleteFramebuffer(fb);
      }
    }
  }
  private createTexture() {
    const gl = this.gl;
    const t = gl.createTexture();
    if (!t) {
      throw Error('Texture allocation failed');
    }
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }
  private prepare(index: number) {
    const gl = this.gl;
    gl.bindVertexArray(this.vao);
    // Attachments never change: validate them at allocation, not on every draw.
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[index]!);
    for (const flag of [gl.BLEND, gl.DEPTH_TEST, gl.STENCIL_TEST, gl.SCISSOR_TEST, gl.CULL_FACE]) {
      gl.disable(flag);
    }
    gl.colorMask(true, true, true, true);
    gl.viewport(0, 0, this.width, this.height);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  }
  private finish() {
    this.gl.bindVertexArray(null);
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
  }
}
