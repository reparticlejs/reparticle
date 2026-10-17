import { Emitter, parseEffectConfig } from '@reparticle/core';
import { RenderContainer, type Texture, type WebGLRenderer } from 'pixi.js';

const vertex = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D particles;
uniform int width;
uniform int rows;
uniform vec2 viewport;
uniform mat3 transform;
uniform vec2 particleSize;
out vec2 uv;
out float life;
void main() {
  int id = gl_InstanceID;
  ivec2 at = ivec2(id % width, id / width);
  vec4 p = texelFetch(particles, at, 0);
  vec4 meta = texelFetch(particles, at + ivec2(0, rows), 0);
  life = meta.z > 0.5 && meta.y > 0.0 ? max(0.0, 1.0 - meta.x / meta.y) : 0.0;
  uv = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  vec2 world = (transform * vec3(p.xy + uv * particleSize * 0.5, 1.0)).xy;
  gl_Position = life > 0.0 ? vec4(world.x / viewport.x * 2.0 - 1.0, 1.0 - world.y / viewport.y * 2.0, 0, 1) : vec4(2,2,0,1);
}`;
const fragment = `#version 300 es
precision highp float;
in vec2 uv;
in float life;
uniform float opacity;
uniform sampler2D artwork;
uniform bool textured;
uniform bool straightAlpha;
uniform vec4 frame;
out vec4 color;
void main() {
  if (textured) {
    vec2 coords = mix(frame.xy, frame.zw, uv * 0.5 + 0.5);
    vec4 pixel = texture(artwork, coords);
    if (straightAlpha) pixel.rgb *= pixel.a;
    color = pixel * opacity;
    return;
  }
  float alpha = max(0.0, 1.0 - dot(uv, uv)) * opacity;
  vec3 tint = vec3(0.55,1.0,0.85);
  color = vec4(tint * alpha, alpha);
}`;
function createProgram(gl: WebGL2RenderingContext): WebGLProgram {
  const program = gl.createProgram();
  if (!program) {
    throw new Error('Unable to create particle program');
  }
  try {
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) {
        throw new Error('Unable to create particle shader');
      }
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message ?? 'Shader compilation failed');
      }
      gl.attachShader(program, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? 'Particle program linking failed');
    }
    return program;
  } catch (error) {
    gl.deleteProgram(program);
    throw error;
  }
}
/** WebGL2 screen-target prototype. Owns its emitter and draw resources. */
export class ParticleView extends RenderContainer {
  readonly emitter: Emitter;
  private readonly host: WebGLRenderer;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly uniforms: Record<string, WebGLUniformLocation | null>;
  private readonly matrix = new Float32Array(9);
  private disposed = false;
  private artwork: Texture | null = null;
  /** Longest particle edge in local units. */
  particleSize = 24;
  /** Caller owns the texture. Untrimmed, unrotated frames are supported. */
  get texture(): Texture | null {
    return this.artwork;
  }
  set texture(value: Texture | null) {
    if (value && (value.trim || value.rotate)) {
      throw new Error('Trimmed or rotated particle textures are not supported yet');
    }
    this.artwork = value;
  }
  constructor(renderer: WebGLRenderer, definition: unknown) {
    const config = parseEffectConfig(definition).emitters[0];
    super({});
    this.host = renderer;
    const gl = renderer.gl;
    this.gl = gl;
    try {
      this.emitter = new Emitter({ gl, canvas: renderer.canvas }, config);
      try {
        this.program = createProgram(gl);
        const vao = gl.createVertexArray();
        if (!vao) {
          gl.deleteProgram(this.program);
          throw new Error('Unable to create draw VAO');
        }
        this.vao = vao;
        this.uniforms = Object.fromEntries(
          [
            'particles',
            'width',
            'rows',
            'viewport',
            'transform',
            'opacity',
            'artwork',
            'textured',
            'straightAlpha',
            'frame',
            'particleSize',
          ].map((name) => [name, gl.getUniformLocation(this.program, name)]),
        );
      } catch (error) {
        this.emitter.destroy();
        throw error;
      }
    } finally {
      renderer.resetState();
    }
  }
  update(dt: number): void {
    try {
      this.emitter.update(dt);
    } finally {
      this.host.resetState();
    }
  }
  reset(): void {
    try {
      this.emitter.reset();
    } finally {
      this.host.resetState();
    }
  }
  override render(): void {
    if (this.disposed) {
      return;
    }
    const gl = this.gl,
      r = this.host,
      u = this.uniforms;
    // This prototype explicitly supports the main canvas only, not filter/render textures.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, r.canvas.width, r.canvas.height);
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);
    const texture = this.artwork;
    if (texture) {
      r.texture.bind(texture.source, 1);
    }
    gl.uniform1i(u.artwork!, 1);
    gl.uniform1i(u.textured!, texture ? 1 : 0);
    gl.uniform1i(u.straightAlpha!, texture?.source.alphaMode === 'no-premultiply-alpha' ? 1 : 0);
    if (texture) {
      const uv = texture.uvs;
      gl.uniform4f(u.frame!, uv.x0, uv.y0, uv.x2, uv.y2);
      const longest = Math.max(texture.orig.width, texture.orig.height);
      gl.uniform2f(
        u.particleSize!,
        (this.particleSize * texture.orig.width) / longest,
        (this.particleSize * texture.orig.height) / longest,
      );
    } else {
      gl.uniform2f(u.particleSize!, 10, 10);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.emitter.texture);
    gl.uniform1i(u.particles!, 0);
    gl.uniform1i(u.width!, this.emitter.width);
    gl.uniform1i(u.rows!, this.emitter.rows);
    gl.uniform2f(u.viewport!, r.screen.width, r.screen.height);
    const t = this.worldTransform,
      m = this.matrix;
    m[0] = t.a;
    m[1] = t.b;
    m[2] = 0;
    m[3] = t.c;
    m[4] = t.d;
    m[5] = 0;
    m[6] = t.tx;
    m[7] = t.ty;
    m[8] = 1;
    gl.uniformMatrix3fv(u.transform!, false, m);
    gl.uniform1f(u.opacity!, this.groupAlpha);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.CULL_FACE);
    gl.colorMask(true, true, true, true);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, texture ? gl.ONE_MINUS_SRC_ALPHA : gl.ONE);
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.emitter.capacity);
    gl.bindVertexArray(null);
    r.resetState();
  }
  override destroy(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.emitter.destroy();
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
    this.host.resetState();
    super.destroy();
  }
}
