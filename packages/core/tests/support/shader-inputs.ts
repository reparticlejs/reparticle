import { d } from 'typegpu';
import { vi } from 'vitest';

import type { ParticleTexture } from '#types/layout.js';

/** CPU tests execute the authored shader math with only GPU storage reads replaced. */
const inputs = vi.hoisted(
  (): {
    rotation: Float32Array;
    angular: Float32Array;
    modifiers: Float32Array;
    state: ParticleTexture;
    mask: Float32Array;
  } => ({
    state: [],
    mask: new Float32Array(0),
    rotation: new Float32Array(65),
    angular: new Float32Array(65),
    modifiers: new Float32Array(1154),
  }),
);
vi.mock('#src/simulation/resources.ts', () => ({
  readCurve: (selector: number, index: number) =>
    (selector === 0 ? inputs.rotation : inputs.angular)[index]!,
  readModifier: (index: number) => inputs.modifiers[index]!,
  readSpawn: (_mask: unknown, index: number) => inputs.mask[index]!,
  readState: (
    _state: unknown,
    _birth: unknown,
    _pass: number,
    _rows: number,
    x: number,
    y: number,
  ) => d.vec4f(...inputs.state[y]![x]!),
}));

export { inputs };
