import { readFile } from 'node:fs/promises';

import { CURVE_SEGMENTS } from '@reparticle/core';
import { globalUniformsBitGl } from 'pixi.js';
import type { TsdownPlugin } from 'tsdown';

const includes = new Map([
  ['curve-constants', `#define CURVE_SEGMENTS ${CURVE_SEGMENTS}`],
  ['pixi-global-uniforms', globalUniformsBitGl.vertex.header],
]);

/** Embed complete GLSL sources in the package; consumers need no shader loader. */
export const shaderPlugin: TsdownPlugin = {
  name: 'particle-shader-includes',

  async load(path) {
    if (!path.endsWith('.glsl')) {
      return null;
    }

    this.addWatchFile(path);
    const source = await readFile(path, 'utf8');
    const code = resolveIncludes(source, path);

    // The text module type lets Rolldown handle JavaScript string escaping.
    return { code, moduleType: 'text' };
  },
};

/** Expand standalone #include <name> directives; fail the build for unknown names. */
function resolveIncludes(source: string, path: string): string {
  return source.replace(/^\s*#include <([^>]+)>\s*$/gm, (_, name: string) => {
    const declaration = includes.get(name);
    if (declaration === undefined) {
      throw new Error(`Unknown shader include <${name}> in ${path}`);
    }
    return declaration;
  });
}
