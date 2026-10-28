import { ParticleEffect } from '@reparticle/pixi';

import { renderingSuite } from '../support/rendering-suite';
renderingSuite(ParticleEffect, ['webgl', 'webgpu']);
