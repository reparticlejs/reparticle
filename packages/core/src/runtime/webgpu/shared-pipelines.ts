import shader from '#simulation/shaders/webgpu.json';

import { GPUShaderStage } from './constants';

// Cache by device identity: pipelines cannot be used with another device.
// Weak keys let an unreachable device and its cached resources be collected.
// Pipelines have no destroy() method, so emitters do not reference-count or release them.
const pipelines = new WeakMap<GPUDevice, ReturnType<typeof createPipelines>>();

/**
 * Return the device's shared birth and motion pipelines, creating them on first use.
 * Effect settings are uploaded as data, so different effects reuse the same pipelines.
 * Destroying an emitter releases its own storage without invalidating this cache.
 *
 * Returned layouts describe bindings, not emitter resources. Each simulation creates
 * its own bind groups from these layouts. The caller supplies a live device; this
 * cache does not recover a lost device or migrate resources to a replacement.
 */
export function getSimulationPipelines(device: GPUDevice) {
  let shared = pipelines.get(device);
  if (!shared) {
    shared = createPipelines(device);
    pipelines.set(device, shared);
  }
  return shared;
}

/** Create two compute pipelines from one generated WGSL module and a shared layout. */
function createPipelines(device: GPUDevice) {
  // TypeGPU generated the WGSL during the package build. WebGPU prepares it for this device.
  const module = device.createShaderModule({ label: 'reparticle simulation', code: shader.source });
  // Group 0: packed step parameters, curves, and modifiers. Matches SimulationData in WGSL.
  const uniforms = device.createBindGroupLayout({
    entries: [{ binding: 0, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } }],
  });
  // Group 1 matches scripts/shaders/webgpu/simulation.wgsl:
  // 0 = previous state, 1 = spawn mask, 2 = birth data, 3 = output, 4 = dimensions.
  const textures = device.createBindGroupLayout({
    entries: [
      // Numerical RGBA32F inputs use textureLoad, not filtered sampling. This also
      // avoids requiring the optional float32-filterable device feature.
      ...[0, 1, 2].map((binding) => ({
        binding,
        visibility: GPUShaderStage.COMPUTE,
        texture: { sampleType: 'unfilterable-float' as const },
      })),
      {
        binding: 3,
        visibility: GPUShaderStage.COMPUTE,
        // Each pass writes its destination directly; no render attachment is needed.
        storageTexture: { access: 'write-only', format: 'rgba32float' },
      },
      { binding: 4, visibility: GPUShaderStage.COMPUTE, buffer: { type: 'uniform' } },
    ],
  });
  // An explicit common layout lets both entry points use the same binding structure.
  // Array order sets the shader group numbers: uniforms = 0, textures = 1.
  const layout = device.createPipelineLayout({ bindGroupLayouts: [uniforms, textures] });
  const pipeline = (entryPoint: string) =>
    device.createComputePipeline({
      label: `reparticle ${entryPoint}`,
      layout,
      compute: { module, entryPoint },
    });
  // births initializes recycled slots; advance updates motion and lifetime state.
  // The simulation decides when to dispatch them and supplies their per-emitter resources.
  return { uniforms, textures, births: pipeline('births'), advance: pipeline('advance') };
}
