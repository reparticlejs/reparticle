import type { EmitterConfig } from '#types/effect.js';

import { SampledCurve } from './sampled-curve';

/** Shape dimensions are sampled per emitter frame; spreads are applied on the GPU at birth. */
export class SampledShape {
  readonly type: number;
  readonly x: SampledCurve;
  readonly y: SampledCurve;
  readonly spreadX: number;
  readonly spreadY: number;

  constructor(shape: EmitterConfig['emission']['shape']) {
    this.type = { point: 0, circle: 1, box: 2, cone2d: 3 }[shape.type];
    switch (shape.type) {
      case 'circle':
        this.x = new SampledCurve(shape.diameter);
        this.y = new SampledCurve(0);
        this.spreadX = shape.diameterSpread;
        this.spreadY = 0;
        break;
      case 'box':
      case 'cone2d':
        this.x = new SampledCurve(shape.width);
        this.y = new SampledCurve(shape.height);
        this.spreadX = shape.widthSpread;
        this.spreadY = shape.heightSpread;
        break;
      case 'point':
        this.x = new SampledCurve(0);
        this.y = new SampledCurve(0);
        this.spreadX = 0;
        this.spreadY = 0;
        break;
    }
  }
}
