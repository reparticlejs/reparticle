import { CURVE_SEGMENTS, type EmitterConfig } from '@reparticle/core';
import { UniformGroup } from 'pixi.js';

import { sampleColorCurves } from '../curves/sample-color-curves';
import { sampleGeometryCurves } from '../curves/sample-geometry-curves';

/**
 * Per-emitter values uploaded by Pixi's shader system. Vector storage is reused.
 * Texture samplers live in Shader.resources; Pixi assigns their texture units.
 * Keep the group dynamic: emitters share a program but have different curves.
 */
export function createUniforms(config: EmitterConfig) {
  return new UniformGroup({
    width: { value: 0, type: 'i32' },
    rows: { value: 0, type: 'i32' },
    emitterOffset: { value: new Float32Array(2), type: 'vec2<f32>' },
    emitterRotation: { value: new Float32Array([1, 0]), type: 'vec2<f32>' },
    emitterScale: { value: 1, type: 'f32' },
    emitterHandedness: { value: 1, type: 'f32' },
    transform: { value: new Float32Array(9), type: 'mat3x3<f32>' },

    displayColor: { value: new Float32Array([1, 1, 1, 1]), type: 'vec4<f32>' },
    tint: { value: new Float32Array([1, 1, 1, 1]), type: 'vec4<f32>' },
    textured: { value: 0, type: 'i32' },
    straightAlpha: { value: 0, type: 'i32' },
    frameTop: { value: new Float32Array(4), type: 'vec4<f32>' },
    frameBottom: { value: new Float32Array(4), type: 'vec4<f32>' },
    textureTrim: { value: new Float32Array([0, 0, 1, 1]), type: 'vec4<f32>' },
    textureFlip: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    particleAspect: { value: new Float32Array([1, 1]), type: 'vec2<f32>' },
    particlePivot: { value: new Float32Array(2), type: 'vec2<f32>' },
    automaticSize: { value: 0, type: 'i32' },
    stretchWithVelocity: { value: 0, type: 'i32' },
    orientToMovement: { value: config.orientation === 'movement-direction' ? 1 : 0, type: 'i32' },
    orientToAngularVelocity: {
      value: config.orientation === 'angular-velocity' ? 1 : 0,
      type: 'i32',
    },

    frameCount: { value: 0, type: 'i32' },
    animationFps: { value: 0, type: 'f32' },
    animationHalfStep: { value: 0, type: 'f32' },
    animationOnce: { value: 0, type: 'i32' },
    animationBackward: { value: 0, type: 'i32' },
    animationPingpong: { value: 0, type: 'i32' },
    geometryCurve: {
      value: sampleGeometryCurves(config.overLifetime),
      type: 'vec4<f32>',
      size: CURVE_SEGMENTS + 1,
    },
    colorCurve: {
      value: sampleColorCurves(config.overLifetime),
      type: 'vec4<f32>',
      size: CURVE_SEGMENTS + 1,
    },
  });
}
