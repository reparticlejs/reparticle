import { createSimulationContext } from '@reparticle/core/webgpu';
import { ExtensionType, Geometry, GpuProgram, Shader, type WebGPURenderer } from 'pixi.js';

import { ParticlePipe } from '#rendering/particle-pipe.js';
import source from '#shaders/webgpu/particle.wgsl';

import { createParticleStateFactory } from './particle-state';

/** Connect the shared particle pipe to Pixi’s WebGPU renderer. */
export class WebGPUParticlePipe extends ParticlePipe {
  public static readonly extension = {
    type: ExtensionType.WebGPUPipes,
    name: 'reparticle',
  } as const;
  public constructor(renderer: WebGPURenderer) {
    super(renderer, {
      bindArtwork: (shader, artwork) => {
        shader.resources.artwork = artwork;
        shader.resources.artworkSampler = artwork.style;
      },
      createState: createParticleStateFactory(renderer),
      get maxTextureSize() {
        return renderer.gpu.device.limits.maxTextureDimension2D;
      },
      createContext: (assertAvailable) =>
        createSimulationContext({ device: renderer.gpu.device, assertAvailable }),
      createShader: (resources) =>
        new Shader({
          gpuProgram: GpuProgram.from({
            name: 'reparticle',
            gpuLayout: [
              [{ binding: 0, visibility: 3, buffer: { type: 'uniform' } }],
              [{ binding: 0, visibility: 3, buffer: { type: 'uniform' } }],
              [
                ...[0, 1, 2].map((binding) => ({
                  binding,
                  visibility: 1,
                  texture: { sampleType: 'unfilterable-float' as const },
                })),
                { binding: 3, visibility: 2, texture: { sampleType: 'float' } },
                { binding: 4, visibility: 2, sampler: { type: 'filtering' } },
              ],
            ],
            vertex: { source, entryPoint: 'mainVertex' },
            fragment: { source, entryPoint: 'mainFragment' },
          }),
          resources,
        }),
      globalGroup: 0,
      createGeometry: () =>
        new Geometry({
          topology: 'triangle-strip',
          attributes: {
            aPosition: { buffer: new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), format: 'float32x2' },
          },
        }),
    });
  }
}
