#version 300 es
precision highp float;
precision highp int;
// Texture reads need their own precision: state includes 24-bit spawn masks.
precision highp sampler2D;

#include <simulation-functions>

uniform sampler2D user_state;
uniform sampler2D user_spawnMask;
uniform sampler2D birthState;
uniform int birthPass;
uniform int constants_width;
uniform int constants_rows;
uniform int constants_capacity;

layout(location=0) out vec4 result;

// The simulation kernel exposes five logical bands. Each band has one texel per slot.
const int MOTION_BAND = 0;     // position.xy, velocity.xy
const int PROPERTIES_BAND = 1; // age, lifetime, size, initial rotation
const int COLOR_BAND = 2;      // red, green, blue, alpha
const int DYNAMICS_BAND = 3;   // alive, modifier variation, angular velocity, rotation
const int GEOMETRY_BAND = 4;   // stretch.xy, handedness, movement heading

// Physical output textures pack those fields into three birth bands and two changing bands.
const int BIRTH_PROPERTIES_BAND = 0;
const int BIRTH_COLOR_BAND = 1;
const int CHANGING_MOTION_BAND = 0;
const int SLOTS_PER_MASK_WORD = 24;

vec4 evaluateBand(ivec2 address, int band) {
  int kernelRow = address.y + constants_rows * band;
  return integrate(
    user_state,
    // Step, emission shape, and appearance.
    data.stepInput, data.emissionInput, data.shapeInput, data.shapeSpreadInput,
    data.appearanceInput, data.colorInput,
    // Per-particle variation, transforms, and orientation.
    data.motionSpreadInput, data.colorSpreadInput, data.geometrySpreadInput,
    data.positionInput, data.transformInput, data.orientationInput,
    user_spawnMask,
    // Curve selectors: read from the uniform block instead of copying arrays.
    0.0, 1.0,
    float(address.x), float(kernelRow),
    float(constants_width), float(constants_rows), float(constants_capacity),
    birthState, float(birthPass)
  );
}

void writeBirthState(ivec2 address, int outputBand) {
  int slot = address.y * constants_width + address.x;
  float mask = readSpawn(user_spawnMask, float(slot / SLOTS_PER_MASK_WORD));
  // Integer decoding keeps packed birth bits exact across GPU drivers.
  uint spawnBit = (uint(mask) >> uint(slot % SLOTS_PER_MASK_WORD)) & 1u;
  float birthCount = data.stepInput.y;

  // Keep existing birth data untouched unless this slot is being recycled.
  if (slot >= constants_capacity || birthCount <= 0.0 || spawnBit == 0u) {
    discard;
  }

  if (outputBand == BIRTH_COLOR_BAND) {
    result = evaluateBand(address, COLOR_BAND);
  } else if (outputBand == BIRTH_PROPERTIES_BAND) {
    vec4 properties = evaluateBand(address, PROPERTIES_BAND);
    float lifetime = properties.y;
    float size = properties.z;
    float initialRotation = properties.w;
    float modifierVariation = evaluateBand(address, DYNAMICS_BAND).y;
    result = vec4(lifetime, size, initialRotation, modifierVariation);
  } else {
    float angularVelocity = evaluateBand(address, DYNAMICS_BAND).z;
    vec4 geometry = evaluateBand(address, GEOMETRY_BAND);
    vec2 stretch = geometry.xy;
    float handedness = geometry.z;
    result = vec4(angularVelocity, stretch, handedness);
  }
}

void writeChangingState(ivec2 address, int outputBand) {
  if (outputBand == CHANGING_MOTION_BAND) {
    result = evaluateBand(address, MOTION_BAND);
  } else {
    float age = evaluateBand(address, PROPERTIES_BAND).x;
    vec4 dynamics = evaluateBand(address, DYNAMICS_BAND);
    float alive = dynamics.x;
    float rotation = dynamics.w;
    float heading = evaluateBand(address, GEOMETRY_BAND).w;
    result = vec4(age, alive, rotation, heading);
  }
}

void main() {
  ivec2 pixel = ivec2(gl_FragCoord.xy);
  ivec2 address = ivec2(pixel.x, pixel.y % constants_rows);
  int outputBand = pixel.y / constants_rows;

  if (birthPass == 1) {
    writeBirthState(address, outputBand);
  } else {
    writeChangingState(address, outputBand);
  }
}
