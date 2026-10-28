import { extensions } from 'pixi.js';

import { WebGPUParticlePipe } from '#rendering/webgpu/particle-pipe.js';

// Register only this backend; the shared API is identical for both entry points.
extensions.add(WebGPUParticlePipe);

export * from './exports';
