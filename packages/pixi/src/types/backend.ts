import type { SimulationContext } from '@reparticle/core';
import type {
  Geometry,
  State,
  Shader,
  ShaderWithResources,
  TextureSource,
  WebGLRenderer,
  WebGPURenderer,
} from 'pixi.js';

export type ParticleRenderer = WebGLRenderer | WebGPURenderer;

/** The pipe shares playback and drawing; this adapter owns backend-specific setup. */
export interface ParticleBackend {
  createContext(
    assertAvailable: () => void,
    restoreState: () => void,
  ): SimulationContext<WebGLTexture | GPUTexture>;
  createShader(resources: NonNullable<ShaderWithResources['resources']>): Shader;
  /** Bind artwork using the resources required by this backend. */
  bindArtwork(this: void, shader: Shader, source: TextureSource): void;
  maxTextureSize: number;
  /** WebGL restores Pixi’s cached bindings after direct simulation work. */
  restoreState?(): void;
  /** Optional eager shader preparation before drawing begins. */
  prepareShader?(shader: Shader): void;
  globalGroup: number;
  createGeometry(): Geometry;
  /** Optional backend-specific blend state for particle draws. */
  createState?(): State;
}
