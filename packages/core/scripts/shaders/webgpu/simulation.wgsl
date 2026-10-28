// Generated functions share the exact simulation equations with WebGL2.
#include <simulation-functions>

struct Dimensions { width: u32, rows: u32, capacity: u32, padding: u32 }
@group(1) @binding(0) var previousState: texture_2d<f32>;
@group(1) @binding(1) var spawnMask: texture_2d<f32>;
@group(1) @binding(2) var birthState: texture_2d<f32>;
@group(1) @binding(3) var outputState: texture_storage_2d<rgba32float, write>;
@group(1) @binding(4) var<uniform> dimensions: Dimensions;

fn evaluateBand(address: vec2u, band: u32, birthPass: f32) -> vec4f {
  return integrate(previousState,
    data.stepInput, data.emissionInput, data.shapeInput, data.shapeSpreadInput,
    data.appearanceInput, data.colorInput, data.motionSpreadInput, data.colorSpreadInput,
    data.geometrySpreadInput, data.positionInput, data.transformInput, data.orientationInput,
    spawnMask, 0.0, 1.0, f32(address.x), f32(address.y + dimensions.rows * band),
    f32(dimensions.width), f32(dimensions.rows), f32(dimensions.capacity), birthState, birthPass);
}

// Only recycled slots are written. Existing birth properties remain untouched.
@compute @workgroup_size(8, 8)
fn births(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= dimensions.width || id.y >= dimensions.rows) { return; }
  let slot = id.y * dimensions.width + id.x;
  let mask = u32(readSpawn(spawnMask, f32(slot / 24u)));
  if (slot >= dimensions.capacity || (mask & (1u << (slot % 24u))) == 0u) { return; }
  let properties = evaluateBand(id.xy, 1u, 1.0);
  let dynamics = evaluateBand(id.xy, 3u, 1.0);
  let geometry = evaluateBand(id.xy, 4u, 1.0);
  textureStore(outputState, vec2i(id.xy), vec4f(properties.yzw, dynamics.y));
  textureStore(outputState, vec2i(id.xy + vec2u(0u, dimensions.rows)), evaluateBand(id.xy, 2u, 1.0));
  textureStore(outputState, vec2i(id.xy + vec2u(0u, dimensions.rows * 2u)), vec4f(dynamics.z, geometry.xyz));
}

// Each invocation advances one slot and writes its two changing-state bands.
@compute @workgroup_size(8, 8)
fn advance(@builtin(global_invocation_id) id: vec3u) {
  if (id.x >= dimensions.width || id.y >= dimensions.rows) { return; }
  let age = evaluateBand(id.xy, 1u, 0.0).x;
  let dynamics = evaluateBand(id.xy, 3u, 0.0);
  let heading = evaluateBand(id.xy, 4u, 0.0).w;
  textureStore(outputState, vec2i(id.xy), evaluateBand(id.xy, 0u, 0.0));
  textureStore(outputState, vec2i(id.xy + vec2u(0u, dimensions.rows)), vec4f(age, dynamics.x, dynamics.w, heading));
}
