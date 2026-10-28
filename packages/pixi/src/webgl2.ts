import { extensions } from 'pixi.js';

import { WebGL2ParticlePipe } from '#rendering/webgl2/particle-pipe.js';

// Register only this backend; the shared API is identical for both entry points.
extensions.add(WebGL2ParticlePipe);

export * from './exports';
