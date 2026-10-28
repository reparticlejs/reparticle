import { State, type WebGPURenderer } from 'pixi.js';

/**
 * Give only this particle pipe's additive draws the same alpha blend as WebGL2.
 * Pixi's WebGPU `add` accumulates RGB but uses a different alpha equation, which
 * changes canvas compositing on transparent backgrounds. Keep Pixi's shared blend
 * definitions untouched: pipeline creation receives a copy for our states only.
 */
export function createParticleStateFactory(renderer: WebGPURenderer): () => State {
  const particles = new WeakSet<State>();
  const getColorTargets = renderer.state.getColorTargets.bind(renderer.state);
  renderer.state.getColorTargets = (state, count, format) => {
    const targets = getColorTargets(state, count, format);
    if (!particles.has(state) || !state.blend || state.blendMode !== 'add') {
      return targets;
    }
    return targets.map((target) => ({
      ...target,
      blend: {
        ...target.blend!,
        alpha: { srcFactor: 'one', dstFactor: 'one', operation: 'add' },
      },
    }));
  };

  // Weak membership does not retain destroyed effects. The wrapper belongs to the
  // renderer, whose pipeline cache also owns the resulting GPU blend states.
  return () => {
    const state = State.for2d();
    particles.add(state);
    return state;
  };
}
