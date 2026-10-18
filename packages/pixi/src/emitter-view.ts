import type { StopOptions } from '@reparticle/core';
import { Emitter, CURVE_SEGMENTS, type EmitterConfig, type ModifierConfig } from '@reparticle/core';
import { RenderContainer, type Texture, type WebGLRenderer, type Matrix } from 'pixi.js';

import { createFrameTexture } from './create-frame-texture';
import { flipbookShader } from './flipbook-shader';
import { resolveFlipbook } from './resolve-flipbook';
import { resolvePivot } from './resolve-pivot';
import { resolveTexture } from './resolve-texture';
import { sampleColorCurves } from './sample-color-curves';
import { sampleGeometryCurves } from './sample-geometry-curves';
import { setBlendMode } from './set-blend-mode';
import type { Flipbook } from './types/flipbook';
import type { ParticleTexture, ParticlePivot } from './types/particle-texture';

const vertex = `#version 300 es
precision highp float;
precision highp int;
uniform sampler2D particles;
uniform int width;
uniform int rows;
uniform vec2 viewport;
uniform vec2 emitterOffset;
uniform vec2 emitterRotation;
uniform float emitterScale;
uniform mat3 transform;
uniform vec2 particleAspect;
uniform bool automaticSize;
uniform vec2 particlePivot;
uniform vec4 textureTrim;
uniform bool stretchWithVelocity;
uniform bool orientToMovement;
uniform bool orientToAngularVelocity;
uniform vec4 geometryCurve[${CURVE_SEGMENTS + 1}];
uniform vec4 colorCurve[${CURVE_SEGMENTS + 1}];
${flipbookShader}
uniform vec4 frameTop;
uniform vec4 frameBottom;
out vec2 artworkUv;
out vec2 uv;
out vec4 particleColor;
void main() {
  int id = gl_InstanceID;
  ivec2 at = ivec2(id % width, id / width);
  vec4 motion = texelFetch(particles, at, 0);
  vec4 properties = texelFetch(particles, at + ivec2(0, rows), 0);
  float life = properties.y > 0.0 ? max(0.0, 1.0 - properties.x / properties.y) : 0.0;
  uv = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  float normalizedAge = properties.y > 0.0 ? clamp(properties.x / properties.y, 0.0, 1.0) : 0.0;
  float curvePosition = normalizedAge * ${CURVE_SEGMENTS}.0;
  int segment = min(int(curvePosition), ${CURVE_SEGMENTS - 1});
  vec4 geometry = mix(geometryCurve[segment], geometryCurve[segment + 1], curvePosition - float(segment));
  vec2 initialStretch = texelFetch(particles, at + ivec2(0, rows * 4), 0).xy;
  vec4 initialColor = texelFetch(particles, at + ivec2(0, rows * 2), 0);
  vec4 colorScale = mix(colorCurve[segment], colorCurve[segment + 1], curvePosition - float(segment));
  particleColor = clamp(initialColor * colorScale, 0.0, 1.0);
  vec2 stretch = initialStretch + geometry.zw;
  // Defold's fixed 60 FPS, 180-degree shutter factor applies only to Y stretch.
  if (stretchWithVelocity) stretch.y *= length(motion.zw) / 120.0;
  vec2 baseSize = particleAspect * properties.z;
  vec4 trim = textureTrim;
  vec4 top = frameTop;
  vec4 bottom = frameBottom;
  if (frameCount > 0) {
    int frame = animationFrame(properties.x, properties.y);
    top = texelFetch(animationFrames, ivec2(0, frame), 0);
    bottom = texelFetch(animationFrames, ivec2(1, frame), 0);
    trim = texelFetch(animationFrames, ivec2(2, frame), 0);
    vec4 dimensions = texelFetch(animationFrames, ivec2(3, frame), 0);
    baseSize = automaticSize ? dimensions.zw : dimensions.xy * properties.z;
  }
  vec2 fraction = uv * 0.5 + 0.5;
  artworkUv = mix(mix(top.xy, top.zw, fraction.x), mix(bottom.xy, bottom.zw, fraction.x), fraction.y);
  vec2 size = baseSize * geometry.x * (vec2(1.0) + stretch);
  float rotation = geometry.y;
  if (orientToAngularVelocity) rotation = texelFetch(particles, at + ivec2(0, rows * 3), 0).z;
  // Defold's positive Z rotation is counterclockwise; canvas Y points down.
  float angle = -radians(properties.w + rotation);
  float sine = sin(angle);
  float cosine = cos(angle);
  vec2 corner = (trim.xy + (uv * 0.5 + 0.5) * trim.zw - 0.5) * size;
  // Defold composes pivot translation inside the particle rotation/scale transform.
  vec2 pivotScale = particleAspect * geometry.x * (vec2(1.0) + stretch);
  if (!automaticSize) pivotScale *= properties.z;
  corner += vec2(particlePivot.x, -particlePivot.y) * pivotScale;
  vec2 rotated = vec2(cosine * corner.x - sine * corner.y, sine * corner.x + cosine * corner.y);
  if (orientToMovement && dot(motion.zw, motion.zw) > 0.0001) {
    vec2 direction = normalize(motion.zw);
    // Match Defold's near-opposite fallback to a half turn.
    if (abs(1.0 - direction.y) <= 0.0001) direction = vec2(0.0, 1.0);
    // Local up is (0, -1): heading cosine = -direction.y, sine = direction.x.
    rotated = vec2(-direction.y * rotated.x - direction.x * rotated.y,
                    direction.x * rotated.x - direction.y * rotated.y);
  }
  vec2 position = (motion.xy + rotated) * emitterScale;
  position = vec2(emitterRotation.x * position.x - emitterRotation.y * position.y,
                  emitterRotation.y * position.x + emitterRotation.x * position.y);
  vec2 world = (transform * vec3(position + emitterOffset, 1.0)).xy;
  gl_Position = life > 0.0 ? vec4(world.x / viewport.x * 2.0 - 1.0, 1.0 - world.y / viewport.y * 2.0, 0, 1) : vec4(2,2,0,1);
}`;
const fragment = `#version 300 es
precision highp float;
in vec2 artworkUv;
in vec2 uv;
in vec4 particleColor;
uniform float opacity;
uniform sampler2D artwork;
uniform bool textured;
uniform bool straightAlpha;
out vec4 color;
void main() {
  if (textured) {
    vec4 pixel = texture(artwork, artworkUv);
    if (straightAlpha) pixel.rgb *= pixel.a;
    color = vec4(pixel.rgb * particleColor.rgb, pixel.a) * (opacity * particleColor.a);
    return;
  }
  float alpha = max(0.0, 1.0 - dot(uv, uv)) * opacity * particleColor.a;
  color = vec4(particleColor.rgb * alpha, alpha);
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
export class EmitterView extends RenderContainer {
  readonly emitter: Emitter;
  private readonly host: WebGLRenderer;
  private readonly gl: WebGL2RenderingContext;
  private readonly program: WebGLProgram;
  private readonly vao: WebGLVertexArrayObject;
  private readonly uniforms: Record<string, WebGLUniformLocation | null>;
  private readonly matrix = new Float32Array(9);
  private disposed = false;
  private flipbook: Flipbook | null = null;
  private automaticSize = false;
  private texturePivot: ParticlePivot = { x: 0, y: 0 };
  private frameTexture: WebGLTexture | null = null;
  private animationHalfStep = 0;
  private artwork: Texture | null = null;
  /** Caller owns the texture. Atlas trim and rotation are respected. */
  get texture(): Texture | null {
    return this.artwork;
  }
  set texture(value: Texture | null) {
    this.setTexture({ texture: value });
  }
  setTexture(options: ParticleTexture): void {
    const pivot = resolvePivot(options.pivot);
    const flipbook = resolveFlipbook(options);
    const texture = flipbook ? flipbook.frames[0]! : resolveTexture(options);
    let frames: WebGLTexture | null = null;
    try {
      if (flipbook) {
        frames = createFrameTexture(this.gl, flipbook.frames);
      }
    } finally {
      this.host.resetState();
    }
    this.gl.deleteTexture(this.frameTexture);
    this.frameTexture = frames;
    this.flipbook = flipbook;
    this.texturePivot = pivot;
    this.automaticSize = options.sizeMode === 'auto' && (flipbook?.frames.length ?? 0) > 1;
    this.artwork = texture;
  }
  constructor(
    renderer: WebGLRenderer,
    config: EmitterConfig,
    options: ParticleTexture = { texture: null },
    sharedModifiers?: ModifierConfig,
  ) {
    const pivot = resolvePivot(options.pivot);
    const animation = resolveFlipbook(options);
    const texture = animation ? animation.frames[0]! : resolveTexture(options);
    const geometryCurve = sampleGeometryCurves(config.overLifetime);
    const colorCurve = sampleColorCurves(config.overLifetime);
    super({});
    this.artwork = texture;
    this.texturePivot = pivot;
    this.automaticSize = options.sizeMode === 'auto' && (animation?.frames.length ?? 0) > 1;
    this.host = renderer;
    const gl = renderer.gl;
    this.gl = gl;
    try {
      this.emitter = new Emitter({ gl, canvas: renderer.canvas }, config, sharedModifiers);
      let program: WebGLProgram | null = null;
      let vao: WebGLVertexArrayObject | null = null;
      try {
        program = createProgram(gl);
        this.program = program;
        vao = gl.createVertexArray();
        if (!vao) {
          throw new Error('Unable to create draw VAO');
        }
        this.vao = vao;
        this.uniforms = Object.fromEntries(
          [
            'particles',
            'width',
            'rows',
            'viewport',
            'emitterOffset',
            'emitterRotation',
            'emitterScale',
            'transform',
            'opacity',
            'artwork',
            'textured',
            'straightAlpha',
            'animationFrames',
            'frameCount',
            'animationFps',
            'animationHalfStep',
            'animationOnce',
            'animationBackward',
            'animationPingpong',
            'frameTop',
            'frameBottom',
            'textureTrim',
            'particleAspect',
            'automaticSize',
            'particlePivot',
            'stretchWithVelocity',
            'orientToMovement',
            'orientToAngularVelocity',
            'geometryCurve[0]',
            'colorCurve[0]',
          ].map((name) => [name, gl.getUniformLocation(this.program, name)]),
        );
        gl.useProgram(this.program);
        gl.uniform1i(
          this.uniforms.orientToMovement!,
          config.orientation === 'movement-direction' ? 1 : 0,
        );
        gl.uniform1i(
          this.uniforms.orientToAngularVelocity!,
          config.orientation === 'angular-velocity' ? 1 : 0,
        );
        gl.uniform4fv(this.uniforms['geometryCurve[0]']!, geometryCurve);
        gl.uniform4fv(this.uniforms['colorCurve[0]']!, colorCurve);
        if (animation) {
          this.frameTexture = createFrameTexture(gl, animation.frames);
          this.flipbook = animation;
        }
      } catch (error) {
        gl.deleteProgram(program);
        gl.deleteVertexArray(vao);
        gl.deleteTexture(this.frameTexture);
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
      if (dt > 0 && Number.isFinite(dt)) {
        this.animationHalfStep = dt * 0.5;
      }
    } finally {
      this.host.resetState();
    }
  }
  play(): void {
    try {
      this.emitter.play();
      this.animationHalfStep = 0;
    } finally {
      this.host.resetState();
    }
  }

  stop(options: StopOptions): void {
    try {
      this.emitter.stop(options);
    } finally {
      this.host.resetState();
    }
  }

  reset(): void {
    try {
      this.emitter.reset();
      this.animationHalfStep = 0;
    } finally {
      this.host.resetState();
    }
  }
  override render(): void {
    this.renderParticles(this.worldTransform, this.groupAlpha);
  }
  renderParticles(transform: Matrix, opacity: number): void {
    if (this.disposed || this.emitter.state === 'sleeping') {
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
    gl.uniform2f(u.particlePivot!, this.texturePivot.x, this.texturePivot.y);
    gl.uniform1i(u.automaticSize!, this.automaticSize ? 1 : 0);
    const animation = this.flipbook;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.frameTexture ?? this.emitter.texture);
    gl.uniform1i(u.animationFrames!, 2);
    gl.uniform1i(u.frameCount!, animation?.frames.length ?? 0);
    gl.uniform1f(u.animationFps!, animation?.fps ?? 0);
    gl.uniform1f(u.animationHalfStep!, this.animationHalfStep);
    gl.uniform1i(u.animationOnce!, animation?.once ? 1 : 0);
    gl.uniform1i(u.animationBackward!, animation?.backward ? 1 : 0);
    gl.uniform1i(u.animationPingpong!, animation?.pingpong ? 1 : 0);
    const texture = this.artwork;
    if (texture) {
      r.texture.bind(texture.source, 1);
    }
    gl.uniform1i(u.artwork!, 1);
    gl.uniform1i(u.textured!, texture ? 1 : 0);
    gl.uniform1i(u.straightAlpha!, texture?.source.alphaMode === 'no-premultiply-alpha' ? 1 : 0);
    if (texture) {
      const uv = texture.uvs;
      gl.uniform4f(u.frameTop!, uv.x0, uv.y0, uv.x1, uv.y1);
      gl.uniform4f(u.frameBottom!, uv.x3, uv.y3, uv.x2, uv.y2);
      const trim = texture.trim;
      gl.uniform4f(
        u.textureTrim!,
        trim ? trim.x / texture.orig.width : 0,
        trim ? trim.y / texture.orig.height : 0,
        trim ? trim.width / texture.orig.width : 1,
        trim ? trim.height / texture.orig.height : 1,
      );
      const longest = Math.max(texture.orig.width, texture.orig.height);
      gl.uniform2f(u.particleAspect!, texture.orig.width / longest, texture.orig.height / longest);
    } else {
      gl.uniform2f(u.particleAspect!, 1, 1);
      gl.uniform4f(u.textureTrim!, 0, 0, 1, 1);
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.emitter.texture);
    gl.uniform1i(u.particles!, 0);
    gl.uniform1i(u.width!, this.emitter.width);
    gl.uniform1i(u.rows!, this.emitter.rows);
    gl.uniform2f(u.viewport!, r.screen.width, r.screen.height);
    const localSpace = this.emitter.space === 'local';
    gl.uniform1i(u.stretchWithVelocity!, this.emitter.stretchWithVelocity ? 1 : 0);
    gl.uniform1f(u.emitterScale!, localSpace ? this.emitter.scale : 1);
    const radians = localSpace ? (-this.emitter.rotation * Math.PI) / 180 : 0;
    gl.uniform2f(u.emitterRotation!, Math.cos(radians), Math.sin(radians));
    gl.uniform2f(
      u.emitterOffset!,
      localSpace ? this.emitter.x : 0,
      localSpace ? this.emitter.y : 0,
    );
    const t = transform,
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
    gl.uniform1f(u.opacity!, opacity);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.CULL_FACE);
    gl.colorMask(true, true, true, true);
    gl.enable(gl.BLEND);
    gl.blendEquation(gl.FUNC_ADD);
    setBlendMode(gl, this.emitter.configuration.blendMode);
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
    this.gl.deleteTexture(this.frameTexture);
    this.gl.deleteProgram(this.program);
    this.gl.deleteVertexArray(this.vao);
    this.host.resetState();
    super.destroy();
  }
}
