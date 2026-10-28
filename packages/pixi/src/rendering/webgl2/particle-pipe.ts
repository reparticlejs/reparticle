import { createSimulationContext } from '@reparticle/core/webgl2';
import { ExtensionType, Geometry, GlProgram, Shader, type WebGLRenderer } from 'pixi.js';

import { ParticlePipe } from '#rendering/particle-pipe.js';
import fragment from '#shaders/webgl2/particle.frag.glsl';
import vertex from '#shaders/webgl2/particle.vert.glsl';

import { restoreSimulationState } from './restore-simulation-state';

/** Connect the shared particle pipe to Pixi’s WebGL2 renderer. */
export class WebGL2ParticlePipe extends ParticlePipe {
  public static readonly extension = {
    type: ExtensionType.WebGLPipes,
    name: 'reparticle',
  } as const;

  public constructor(renderer: WebGLRenderer) {
    super(renderer, {
      bindArtwork: (shader, source) => {
        shader.resources.artwork = source;
      },
      get maxTextureSize() {
        return renderer.gl.getParameter(renderer.gl.MAX_TEXTURE_SIZE);
      },

      createContext: (assertAvailable, restoreState) =>
        createSimulationContext({
          gl: renderer.gl,
          canvas: renderer.canvas,
          assertAvailable,
          restoreState,
        }),

      createShader: (resources) =>
        new Shader({
          glProgram: GlProgram.from({ vertex, fragment, name: 'reparticle' }),
          resources,
        }),

      prepareShader: (shader) => {
        renderer.shader.bind(shader, true);
      },

      restoreState: () => restoreSimulationState(renderer),

      globalGroup: 100,

      createGeometry: () => new Geometry({ topology: 'triangle-strip' }),
    });
  }
}
