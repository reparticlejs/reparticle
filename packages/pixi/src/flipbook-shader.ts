/** Particle playback: once uses lifetime, loops use FPS, pingpong omits repeated endpoints. */
export const flipbookShader = `
uniform sampler2D animationFrames;
uniform int frameCount;
uniform float animationFps;
uniform float animationHalfStep;
uniform bool animationOnce;
uniform bool animationBackward;
uniform bool animationPingpong;
int animationFrame(float age, float lifetime) {
  int count = animationPingpong ? max(1, frameCount * 2 - 2) : frameCount;
  float cursor = max(0.0, age - animationHalfStep);
  float progress = animationOnce ? cursor / max(lifetime, 0.000001) * float(count) : cursor * animationFps;
  int frame = int(mod(floor(progress), float(count)));
  if (frame >= frameCount) frame = (frameCount - 1) * 2 - frame;
  if (animationBackward) frame = count - frame - 1;
  return frame;
}
`;
