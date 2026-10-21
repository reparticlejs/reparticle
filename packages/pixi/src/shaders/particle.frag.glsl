#version 300 es
precision highp float;

// Interpolated artwork coordinates and particle appearance.
in vec2 artworkUv;
in vec2 uv;
in vec4 particleColor;
in vec4 renderColor;

// Artwork sampling and per-emitter tint.
uniform sampler2D artwork;
uniform bool textured;
uniform bool straightAlpha;
uniform vec4 tint;

out vec4 color;

// Return premultiplied color regardless of the source texture's alpha mode.
vec4 sampleArtwork() {
  vec4 pixel = texture(artwork, artworkUv);
  if (straightAlpha) {
    pixel.rgb *= pixel.a;
  }
  return vec4(pixel.rgb * particleColor.rgb, pixel.a) * particleColor.a;
}

// Untextured particles fade from the center to the edge of a unit circle.
vec4 softCircle() {
  float coverage = max(0.0, 1.0 - dot(uv, uv));
  float alpha = coverage * particleColor.a;
  return vec4(particleColor.rgb * alpha, alpha);
}

void main() {
  vec4 particle = textured ? sampleArtwork() : softCircle();
  vec4 premultipliedTint = vec4(tint.rgb * tint.a, tint.a);

  // Particle color, emitter tint and inherited Pixi color each contribute alpha once.
  color = particle * premultipliedTint * renderColor;
}
