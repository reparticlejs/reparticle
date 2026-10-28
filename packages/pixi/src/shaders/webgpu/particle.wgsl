// Pixi supplies projection, render-group transforms, and inherited color.
struct GlobalUniforms {
  uProjectionMatrix: mat3x3<f32>,
  uWorldTransformMatrix: mat3x3<f32>,
  uWorldColorAlpha: vec4<f32>,
  uResolution: vec2<f32>,
}
@group(0) @binding(0) var<uniform> globalUniforms: GlobalUniforms;

// Field order matches createUniforms(), including vec4-aligned sampled curves.
struct ParticleUniforms {
  width: i32,
  rows: i32,
  emitterOffset: vec2<f32>,
  emitterRotation: vec2<f32>,
  emitterScale: f32,
  emitterHandedness: f32,
  transform: mat3x3<f32>,
  displayColor: vec4<f32>,
  tint: vec4<f32>,
  particleAspect: vec2<f32>,
  particlePivot: vec2<f32>,
  textureFlip: vec2<f32>,
  automaticSize: i32,
  stretchWithVelocity: i32,
  orientToMovement: i32,
  orientToAngularVelocity: i32,
  textured: i32,
  straightAlpha: i32,
  frameTop: vec4<f32>,
  frameBottom: vec4<f32>,
  textureTrim: vec4<f32>,
  frameCount: i32,
  animationFps: f32,
  animationHalfStep: f32,
  animationOnce: i32,
  animationBackward: i32,
  animationPingpong: i32,
  geometryCurve: array<vec4<f32>, 65>,
  colorCurve: array<vec4<f32>, 65>,
}
@group(1) @binding(0) var<uniform> particleUniforms: ParticleUniforms;
@group(2) @binding(0) var particles: texture_2d<f32>;
@group(2) @binding(1) var birthParticles: texture_2d<f32>;
@group(2) @binding(2) var animationFrames: texture_2d<f32>;
@group(2) @binding(3) var artwork: texture_2d<f32>;
@group(2) @binding(4) var artworkSampler: sampler;

struct VertexOutput {
  @builtin(position) position: vec4<f32>,
  @location(0) artworkUv: vec2<f32>,
  @location(1) uv: vec2<f32>,
  @location(2) particleColor: vec4<f32>,
  @location(3) renderColor: vec4<f32>,
}

fn rotateVector(vector: vec2f, rotation: vec2f) -> vec2f {
  return vec2f(rotation.x * vector.x - rotation.y * vector.y,
    rotation.y * vector.x + rotation.x * vector.y);
}

// Frame selection follows the same half-step and ping-pong rules as WebGL2.
fn animationFrame(age: f32, lifetime: f32) -> i32 {
  let length = select(particleUniforms.frameCount, max(1, particleUniforms.frameCount * 2 - 2), particleUniforms.animationPingpong != 0);
  let cursor = max(0.0, age - particleUniforms.animationHalfStep);
  let progress = select(cursor * particleUniforms.animationFps, cursor / max(lifetime, 0.000001) * f32(length), particleUniforms.animationOnce != 0);
  var frame = i32(floor(progress)) % length;
  if (frame >= particleUniforms.frameCount) { frame = (particleUniforms.frameCount - 1) * 2 - frame; }
  if (particleUniforms.animationBackward != 0) { frame = length - frame - 1; }
  return frame;
}

@vertex
fn mainVertex(@location(0) aPosition: vec2<f32>, @builtin(instance_index) slot: u32) -> VertexOutput {
  let address = vec2i(i32(slot) % particleUniforms.width, i32(slot) / particleUniforms.width);
  let motion = textureLoad(particles, address, 0);
  let state = textureLoad(particles, address + vec2i(0, particleUniforms.rows), 0);
  let birth = textureLoad(birthParticles, address, 0);
  let initialColor = textureLoad(birthParticles, address + vec2i(0, particleUniforms.rows), 0);
  let geometry = textureLoad(birthParticles, address + vec2i(0, particleUniforms.rows * 2), 0);
  // state = age, alive, rotation, heading; birth = lifetime, size, rotation, variation.
  var normalizedAge = 0.0;
  if (birth.x > 0.0) { normalizedAge = clamp(state.x / birth.x, 0.0, 1.0); }
  let curvePosition = normalizedAge * 64.0;
  let segment = min(i32(curvePosition), 63);
  let fraction = curvePosition - f32(segment);
  let appearance = mix(particleUniforms.geometryCurve[segment], particleUniforms.geometryCurve[segment + 1], fraction);
  let colorScale = mix(particleUniforms.colorCurve[segment], particleUniforms.colorCurve[segment + 1], fraction);
  var stretch = geometry.yz + appearance.zw;
  if (particleUniforms.stretchWithVelocity != 0) { stretch.y *= length(motion.zw) / 120.0; }
  let rotation = select(appearance.y, state.z, particleUniforms.orientToAngularVelocity != 0);

  var top = particleUniforms.frameTop;
  var bottom = particleUniforms.frameBottom;
  var trim = particleUniforms.textureTrim;
  var baseSize = particleUniforms.particleAspect * birth.y;
  if (particleUniforms.frameCount > 0) {
    let frame = animationFrame(state.x, birth.x);
    top = textureLoad(animationFrames, vec2i(0, frame), 0);
    bottom = textureLoad(animationFrames, vec2i(1, frame), 0);
    trim = textureLoad(animationFrames, vec2i(2, frame), 0);
    if (particleUniforms.automaticSize != 0) { baseSize = textureLoad(animationFrames, vec2i(3, frame), 0).xy; }
  }
  let coordinates = aPosition;
  let stretchScale = vec2f(1.0) + stretch;
  let size = baseSize * appearance.x * stretchScale;
  var corner = (trim.xy + coordinates * trim.zw - vec2f(0.5)) * size * particleUniforms.textureFlip;
  var pivotScale = particleUniforms.particleAspect * appearance.x * stretchScale;
  if (particleUniforms.automaticSize == 0) { pivotScale *= birth.y; }
  corner += vec2f(particleUniforms.particlePivot.x, -particleUniforms.particlePivot.y) * pivotScale;
  corner.x *= geometry.w;
  let movement = select(0.0, state.w, particleUniforms.orientToMovement != 0);
  let angle = -radians(birth.z + rotation * geometry.w + movement);
  corner = rotateVector(corner, vec2f(cos(angle), sin(angle)));
  var position = (motion.xy + corner) * particleUniforms.emitterScale;
  position.x *= particleUniforms.emitterHandedness;
  position = rotateVector(position, particleUniforms.emitterRotation);
  let clip = globalUniforms.uProjectionMatrix * globalUniforms.uWorldTransformMatrix * particleUniforms.transform * vec3f(position + particleUniforms.emitterOffset, 1.0);
  var output: VertexOutput;
  output.position = select(vec4f(2.0, 2.0, 0.0, 1.0), vec4f(clip.xy, 0.0, 1.0), state.y > 0.5);
  output.uv = coordinates * 2.0 - 1.0;
  output.artworkUv = mix(mix(top.xy, top.zw, coordinates.x), mix(bottom.xy, bottom.zw, coordinates.x), coordinates.y);
  output.particleColor = clamp(initialColor * colorScale, vec4f(0.0), vec4f(1.0));
  output.renderColor = particleUniforms.displayColor * globalUniforms.uWorldColorAlpha;
  return output;
}

@fragment
fn mainFragment(input: VertexOutput) -> @location(0) vec4f {
  var particle: vec4f;
  if (particleUniforms.textured != 0) {
    var pixel = textureSample(artwork, artworkSampler, input.artworkUv);
    if (particleUniforms.straightAlpha != 0) { pixel = vec4f(pixel.rgb * pixel.a, pixel.a); }
    particle = vec4f(pixel.rgb * input.particleColor.rgb, pixel.a) * input.particleColor.a;
  } else {
    let alpha = max(0.0, 1.0 - dot(input.uv, input.uv)) * input.particleColor.a;
    particle = vec4f(input.particleColor.rgb * alpha, alpha);
  }
  let tint = vec4f(particleUniforms.tint.rgb * particleUniforms.tint.a, particleUniforms.tint.a);
  return particle * tint * input.renderColor;
}
