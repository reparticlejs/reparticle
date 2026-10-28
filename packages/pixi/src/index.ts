import { extensions, ExtensionType } from 'pixi.js';

// Pixi awaits these before constructing pipes. Only its selected backend is downloaded.
extensions.add(
  {
    extension: { type: ExtensionType.WebGLLoader, name: 'reparticle' },
    load: () => import('./webgl2'),
  },
  {
    extension: { type: ExtensionType.WebGPULoader, name: 'reparticle' },
    load: () => import('./webgpu'),
  },
);
export * from './exports';
