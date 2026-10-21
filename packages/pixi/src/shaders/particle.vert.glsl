#version 300 es
precision highp float;
precision highp int;

#include <curve-constants>
#include <pixi-global-uniforms>

// Simulation storage and draw order.
layout(location = 0) in uint particleId;
uniform sampler2D particles;
uniform int width;
uniform int rows;

// Emitter and Pixi transforms.
uniform vec2 emitterOffset;
uniform vec2 emitterRotation;
uniform float emitterScale;
uniform float emitterHandedness;
uniform mat3 transform;
uniform vec4 displayColor;

// Particle appearance over lifetime.
uniform vec4 geometryCurve[CURVE_SEGMENTS + 1];
uniform vec4 colorCurve[CURVE_SEGMENTS + 1];
uniform bool stretchWithVelocity;
uniform bool orientToMovement;
uniform bool orientToAngularVelocity;

// Artwork geometry and atlas coordinates.
uniform vec2 particleAspect;
uniform bool automaticSize;
uniform vec2 particlePivot;
uniform vec4 textureTrim;
uniform vec2 textureFlip;
uniform vec4 frameTop;
uniform vec4 frameBottom;

// Flipbook playback and frame metadata.
uniform sampler2D animationFrames;
uniform int frameCount;
uniform float animationFps;
uniform float animationHalfStep;
uniform bool animationOnce;
uniform bool animationBackward;
uniform bool animationPingpong;

out vec2 artworkUv;
out vec2 uv;
out vec4 particleColor;
out vec4 renderColor;

struct Particle {
  vec2 position;
  vec2 velocity;
  float age;
  float lifetime;
  float initialSize;
  float initialRotation;
  vec4 initialColor;
  bool alive;
  float accumulatedRotation;
  vec2 initialStretch;
  float initialHandedness;
  float movementHeading;
};

struct Appearance {
  float sizeMultiplier;
  float rotation;
  vec2 stretch;
  vec4 color;
};

struct ArtworkFrame {
  vec4 top;
  vec4 bottom;
  vec4 trim;
  vec2 baseSize;
};

// Each slot occupies the same column in five row bands.
Particle readParticle() {
  int slot = int(particleId);
  ivec2 address = ivec2(slot % width, slot / width);
  vec4 motion = texelFetch(particles, address, 0);
  vec4 lifetime = texelFetch(particles, address + ivec2(0, rows), 0);
  vec4 color = texelFetch(particles, address + ivec2(0, rows * 2), 0);
  vec4 dynamics = texelFetch(particles, address + ivec2(0, rows * 3), 0);
  vec4 geometry = texelFetch(particles, address + ivec2(0, rows * 4), 0);

  Particle particle;
  particle.position = motion.xy;
  particle.velocity = motion.zw;
  particle.age = lifetime.x;
  particle.lifetime = lifetime.y;
  particle.initialSize = lifetime.z;
  particle.initialRotation = lifetime.w;
  particle.initialColor = color;
  particle.alive = dynamics.x > 0.5;
  particle.accumulatedRotation = dynamics.w;
  particle.initialStretch = geometry.xy;
  particle.initialHandedness = geometry.z;
  particle.movementHeading = geometry.w;
  return particle;
}

Appearance sampleAppearance(Particle particle) {
  float normalizedAge = particle.lifetime > 0.0
    ? clamp(particle.age / particle.lifetime, 0.0, 1.0)
    : 0.0;
  float curvePosition = normalizedAge * float(CURVE_SEGMENTS);
  int segment = min(int(curvePosition), CURVE_SEGMENTS - 1);
  float fraction = curvePosition - float(segment);

  // Geometry samples pack size, rotation, stretch X and stretch Y.
  vec4 geometry = mix(geometryCurve[segment], geometryCurve[segment + 1], fraction);
  vec4 colorScale = mix(colorCurve[segment], colorCurve[segment + 1], fraction);

  Appearance appearance;
  appearance.sizeMultiplier = geometry.x;
  appearance.rotation = geometry.y;
  appearance.stretch = particle.initialStretch + geometry.zw;
  appearance.color = clamp(particle.initialColor * colorScale, 0.0, 1.0);

  // A fixed 60 FPS, 180-degree shutter factor applies only to Y stretch.
  if (stretchWithVelocity) {
    appearance.stretch.y *= length(particle.velocity) / 120.0;
  }
  if (orientToAngularVelocity) {
    appearance.rotation = particle.accumulatedRotation;
  }
  return appearance;
}

// Once playback uses lifetime; loops use FPS. Pingpong omits repeated endpoints.
int animationFrame(float age, float lifetime) {
  int playbackLength = animationPingpong ? max(1, frameCount * 2 - 2) : frameCount;
  float cursor = max(0.0, age - animationHalfStep);
  float progress = animationOnce
    ? cursor / max(lifetime, 0.000001) * float(playbackLength)
    : cursor * animationFps;

  int frame = int(mod(floor(progress), float(playbackLength)));
  if (frame >= frameCount) {
    frame = (frameCount - 1) * 2 - frame;
  }
  if (animationBackward) {
    frame = playbackLength - frame - 1;
  }
  return frame;
}

ArtworkFrame selectArtwork(Particle particle) {
  ArtworkFrame artwork;
  artwork.top = frameTop;
  artwork.bottom = frameBottom;
  artwork.trim = textureTrim;
  artwork.baseSize = particleAspect * particle.initialSize;

  if (frameCount > 0) {
    int frame = animationFrame(particle.age, particle.lifetime);
    artwork.top = texelFetch(animationFrames, ivec2(0, frame), 0);
    artwork.bottom = texelFetch(animationFrames, ivec2(1, frame), 0);
    artwork.trim = texelFetch(animationFrames, ivec2(2, frame), 0);
    vec2 dimensions = texelFetch(animationFrames, ivec2(3, frame), 0).xy;
    if (automaticSize) {
      artwork.baseSize = dimensions;
    }
  }
  return artwork;
}

// Interpolate all four atlas corners, including rotated atlas frames.
vec2 artworkCoordinates(ArtworkFrame artwork, vec2 cornerCoordinates) {
  vec2 top = mix(artwork.top.xy, artwork.top.zw, cornerCoordinates.x);
  vec2 bottom = mix(artwork.bottom.xy, artwork.bottom.zw, cornerCoordinates.x);
  return mix(top, bottom, cornerCoordinates.y);
}

// Size and position the artwork before applying particle rotation.
vec2 artworkCorner(
  Particle particle,
  Appearance appearance,
  ArtworkFrame artwork,
  vec2 cornerCoordinates
) {
  vec2 stretchScale = vec2(1.0) + appearance.stretch;
  vec2 size = artwork.baseSize * appearance.sizeMultiplier * stretchScale;
  vec2 corner = (artwork.trim.xy + cornerCoordinates * artwork.trim.zw - 0.5) * size;

  // Reflect trimmed artwork within its original extent, before translating the pivot.
  corner *= textureFlip;

  // Pivot Y points up; canvas Y points down. Automatic sizing keeps pivot scaling
  // independent of each frame's dimensions.
  vec2 pivotScale = particleAspect * appearance.sizeMultiplier * stretchScale;
  if (!automaticSize) {
    pivotScale *= particle.initialSize;
  }
  corner += vec2(particlePivot.x, -particlePivot.y) * pivotScale;
  corner.x *= particle.initialHandedness;
  return corner;
}

// Combine rotations in degrees, then convert to canvas-space radians.
float particleRotation(Particle particle, Appearance appearance) {
  float movement = orientToMovement ? particle.movementHeading : 0.0;
  float rotation = particle.initialRotation
    + appearance.rotation * particle.initialHandedness
    + movement;

  // Positive Z rotation is counterclockwise; canvas Y points down.
  return -radians(rotation);
}

// Rotation stores cosine in X and sine in Y, including precomputed emitter rotation.
vec2 rotateVector(vec2 vector, vec2 rotation) {
  return vec2(
    rotation.x * vector.x - rotation.y * vector.y,
    rotation.y * vector.x + rotation.x * vector.y
  );
}

vec2 projectPosition(vec2 position) {
  position *= emitterScale;
  position.x *= emitterHandedness;

  // Emitter rotation stores cosine and sine, avoiding per-vertex trigonometry.
  position = rotateVector(position, emitterRotation);
  return (
    uProjectionMatrix * uWorldTransformMatrix * transform
    * vec3(position + emitterOffset, 1.0)
  ).xy;
}

void main() {
  Particle particle = readParticle();
  Appearance appearance = sampleAppearance(particle);
  ArtworkFrame artwork = selectArtwork(particle);

  // Four triangle-strip corners: [0, 1] for artwork, [-1, 1] for the soft circle.
  vec2 cornerCoordinates = vec2(float(gl_VertexID & 1), float(gl_VertexID >> 1));
  uv = cornerCoordinates * 2.0 - 1.0;
  artworkUv = artworkCoordinates(artwork, cornerCoordinates);
  particleColor = appearance.color;

  vec2 corner = artworkCorner(particle, appearance, artwork, cornerCoordinates);
  float angle = particleRotation(particle, appearance);
  corner = rotateVector(corner, vec2(cos(angle), sin(angle)));
  vec2 clipPosition = projectPosition(particle.position + corner);

  // Both colors are premultiplied by Pixi; apply inherited alpha exactly once.
  renderColor = displayColor * uWorldColorAlpha;
  // Inactive slots collapse outside the clip volume.
  gl_Position = particle.alive ? vec4(clipPosition, 0.0, 1.0) : vec4(2.0, 2.0, 0.0, 1.0);
}
