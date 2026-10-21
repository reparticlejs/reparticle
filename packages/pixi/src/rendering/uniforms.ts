import { CURVE_SEGMENTS, type EmitterConfig } from '@reparticle/core';
import { Matrix, UniformGroup } from 'pixi.js';

import { packColorCurves } from '../curves/pack-color-curves';
import { packGeometryCurves } from '../curves/pack-geometry-curves';

/**
 * Create one emitter's shader settings, with names matching the particle GLSL shaders.
 * EmitterView fills runtime values before drawing and reuses the vector storage.
 * Particle state and artwork textures are separate Shader.resources bindings;
 * Pixi's global group supplies projection and render-group transforms and color.
 *
 * Keep this group dynamic: emitters share a shader program but have different values.
 * Boolean shader switches use integer uniforms: 0 is disabled, 1 is enabled.
 */
export function createUniforms(config: EmitterConfig) {
  return new UniformGroup({
    // Simulation texture layout. Each state band contains `rows` rows of `width` slots.
    width: { value: 0, type: 'i32' },
    rows: { value: 0, type: 'i32' },

    // Local-space particles follow the emitter; world-space particles use identity values.
    emitterOffset: { value: new Float32Array(2), type: 'vec2<f32>' }, // [x, y]
    emitterRotation: { value: new Float32Array([1, 0]), type: 'vec2<f32>' }, // [cos, sin]
    emitterScale: { value: 1, type: 'f32' },
    emitterHandedness: { value: 1, type: 'f32' }, // -1 reflects the local X axis.
    // Convert simulation coordinates into the current Pixi render group's coordinates.
    transform: { value: new Matrix(), type: 'mat3x3<f32>' },

    // White RGBA leaves colors unchanged. Pixi color is premultiplied; emitter tint is straight.
    displayColor: { value: new Float32Array([1, 1, 1, 1]), type: 'vec4<f32>' },
    tint: { value: new Float32Array([1, 1, 1, 1]), type: 'vec4<f32>' },

    // Particle geometry. Unit aspect/flip and zero pivot leave a centered square unchanged.
    particleAspect: { value: new Float32Array([1, 1]), type: 'vec2<f32>' }, // [width, height] ratios
    particlePivot: { value: new Float32Array(2), type: 'vec2<f32>' }, // [x right, y up]
    textureFlip: { value: new Float32Array([1, 1]), type: 'vec2<f32>' }, // -1 mirrors that axis.
    automaticSize: { value: 0, type: 'i32' }, // Use each animation frame's original dimensions.
    stretchWithVelocity: { value: 0, type: 'i32' },
    orientToMovement: { value: config.orientation === 'movement-direction' ? 1 : 0, type: 'i32' },
    orientToAngularVelocity: {
      value: config.orientation === 'angular-velocity' ? 1 : 0,
      type: 'i32',
    },

    // Static artwork. UV corners come from Pixi, including rotated atlas frames.
    textured: { value: 0, type: 'i32' }, // Disabled selects the procedural soft circle.
    straightAlpha: { value: 0, type: 'i32' }, // Premultiply artwork RGB when enabled.
    frameTop: { value: new Float32Array(4), type: 'vec4<f32>' }, // [left U, left V, right U, right V]
    frameBottom: { value: new Float32Array(4), type: 'vec4<f32>' }, // Same order along the bottom.
    // [x, y, width, height] relative to the original frame; this default means no trimming.
    textureTrim: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },

    // Flipbook playback. Zero frames selects the static artwork settings above.
    frameCount: { value: 0, type: 'i32' },
    animationFps: { value: 0, type: 'f32' }, // Loop playback speed; once playback uses lifetime.
    animationHalfStep: { value: 0, type: 'f32' }, // Half the last simulation step, in seconds.
    animationOnce: { value: 0, type: 'i32' },
    animationBackward: { value: 0, type: 'i32' },
    animationPingpong: { value: 0, type: 'i32' },

    // Lifetime curves include both endpoints. The shader interpolates neighboring vec4 samples.
    geometryCurve: {
      value: packGeometryCurves(config.overLifetime), // [scale, rotation degrees, stretch X, stretch Y]
      type: 'vec4<f32>',
      size: CURVE_SEGMENTS + 1,
    },
    colorCurve: {
      value: packColorCurves(config.overLifetime), // [red, green, blue, alpha] multipliers
      type: 'vec4<f32>',
      size: CURVE_SEGMENTS + 1,
    },
  });
}
