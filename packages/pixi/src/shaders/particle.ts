import { CURVE_SEGMENTS } from '@reparticle/core';
import { globalUniformsBitGl } from 'pixi.js';

import { flipbookShader } from './flipbook';

export const vertex = `#version 300 es
precision highp float;
precision highp int;
layout(location = 0) in uint particleId;
uniform sampler2D particles;
uniform int width;
uniform int rows;

uniform vec2 emitterOffset;
uniform vec2 emitterRotation;
uniform float emitterScale;
uniform float emitterHandedness;
${globalUniformsBitGl.vertex.header}
uniform mat3 transform;
uniform vec4 displayColor;
out vec4 renderColor;
uniform vec2 particleAspect;
uniform bool automaticSize;
uniform vec2 particlePivot;
uniform vec4 textureTrim;
uniform vec2 textureFlip;
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
  int id = int(particleId);
  ivec2 at = ivec2(id % width, id / width);
  vec4 motion = texelFetch(particles, at, 0);
  vec4 properties = texelFetch(particles, at + ivec2(0, rows), 0);
  vec4 dynamics = texelFetch(particles, at + ivec2(0, rows * 3), 0);
  uv = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1)) * 2.0 - 1.0;
  float normalizedAge = properties.y > 0.0 ? clamp(properties.x / properties.y, 0.0, 1.0) : 0.0;
  float curvePosition = normalizedAge * ${CURVE_SEGMENTS}.0;
  int segment = min(int(curvePosition), ${CURVE_SEGMENTS - 1});
  vec4 geometry = mix(geometryCurve[segment], geometryCurve[segment + 1], curvePosition - float(segment));
  vec4 geometryData = texelFetch(particles, at + ivec2(0, rows * 4), 0);
  vec2 initialStretch = geometryData.xy;
  float initialHandedness = geometryData.z;
  vec4 initialColor = texelFetch(particles, at + ivec2(0, rows * 2), 0);
  vec4 colorScale = mix(colorCurve[segment], colorCurve[segment + 1], curvePosition - float(segment));
  particleColor = clamp(initialColor * colorScale, 0.0, 1.0);
  vec2 stretch = initialStretch + geometry.zw;
  // The fixed 60 FPS, 180-degree shutter factor applies only to Y stretch.
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
    if (automaticSize) baseSize = dimensions.xy;
  }
  vec2 fraction = uv * 0.5 + 0.5;
  artworkUv = mix(mix(top.xy, top.zw, fraction.x), mix(bottom.xy, bottom.zw, fraction.x), fraction.y);
  vec2 size = baseSize * geometry.x * (vec2(1.0) + stretch);
  float rotation = geometry.y;
  if (orientToAngularVelocity) rotation = dynamics.w;
  // Positive Z rotation is counterclockwise; canvas Y points down.
  float movement = orientToMovement ? geometryData.w : 0.0;
  float angle = -radians(properties.w + rotation * initialHandedness + movement);
  float sine = sin(angle);
  float cosine = cos(angle);
  vec2 corner = (trim.xy + (uv * 0.5 + 0.5) * trim.zw - 0.5) * size;
  // Reflect trimmed artwork within its original extent; keep pivot translation unchanged.
  corner *= textureFlip;
  // Compose pivot translation inside the particle rotation/scale transform.
  vec2 pivotScale = particleAspect * geometry.x * (vec2(1.0) + stretch);
  if (!automaticSize) pivotScale *= properties.z;
  corner += vec2(particlePivot.x, -particlePivot.y) * pivotScale;
  corner.x *= initialHandedness;
  vec2 rotated = vec2(cosine * corner.x - sine * corner.y, sine * corner.x + cosine * corner.y);
  vec2 position = (motion.xy + rotated) * emitterScale;
  position.x *= emitterHandedness;
  position = vec2(emitterRotation.x * position.x - emitterRotation.y * position.y,
                  emitterRotation.y * position.x + emitterRotation.x * position.y);
  vec2 clip = (uProjectionMatrix * uWorldTransformMatrix * transform * vec3(position + emitterOffset, 1.0)).xy;
  // Both colors are premultiplied by Pixi; apply inherited alpha exactly once.
  renderColor = displayColor * uWorldColorAlpha;
  gl_Position = dynamics.x > 0.5 ? vec4(clip, 0, 1) : vec4(2,2,0,1);
}`;
export const fragment = `#version 300 es
precision highp float;
in vec2 artworkUv;
in vec2 uv;
in vec4 particleColor;
in vec4 renderColor;
uniform vec4 tint;
uniform sampler2D artwork;
uniform bool textured;
uniform bool straightAlpha;
out vec4 color;
void main() {
  vec4 premultipliedTint = vec4(tint.rgb * tint.a, tint.a);
  if (textured) {
    vec4 pixel = texture(artwork, artworkUv);
    if (straightAlpha) pixel.rgb *= pixel.a;
    color = vec4(pixel.rgb * particleColor.rgb, pixel.a) * particleColor.a * premultipliedTint * renderColor;
    return;
  }
  float alpha = max(0.0, 1.0 - dot(uv, uv)) * particleColor.a;
  color = vec4(particleColor.rgb * alpha, alpha) * premultipliedTint * renderColor;
}`;
