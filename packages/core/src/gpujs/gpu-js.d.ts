import type { IGPUFunctionSettings } from 'gpu.js';

// GPU.js accepts JavaScript source strings, but omits this overload from its types.
declare module 'gpu.js' {
  interface GPU {
    addFunction(source: string, settings?: IGPUFunctionSettings): this;
  }
}
