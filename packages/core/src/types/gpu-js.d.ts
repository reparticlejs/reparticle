import type { IGPUFunctionSettings } from 'gpu.js';

/**
 * Fill the missing string overload in GPU.js's addFunction declarations.
 * create-kernels.ts registers helper source from the build-generated
 * simulation/functions.json; GPU.js parses that JavaScript into GPU functions.
 *
 * This augments the installed GPU class without replacing its function overload
 * or changing runtime behavior. The top-level import makes this a module
 * augmentation rather than a declaration of a replacement 'gpu.js' module.
 */
declare module 'gpu.js' {
  interface GPU {
    /**
     * Register a named JavaScript helper for kernels to call.
     * Source must use GPU.js's supported syntax; it is not native GLSL.
     * Optional settings use the upstream type, including return-type overrides.
     */
    addFunction(source: string, settings?: IGPUFunctionSettings): this;
  }
}
