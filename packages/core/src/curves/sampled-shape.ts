import type { EmitterConfig } from '#types/effect.js';

import { SampledCurve } from './sampled-curve';

// Numeric identifiers consumed by the simulation kernel's shape branches.
const SHAPE_TYPES = {
  point: 0,
  circle: 1,
  box: 2,
  cone2d: 3,
} as const;

/**
 * Prepare authored shape dimensions for evaluation over emitter lifetime.
 * Each dimension is sampled once; playback reads the cached curves each frame.
 * The GPU applies dimension spreads independently when each particle is born.
 */
export class SampledShape {
  /** Numeric shape identifier passed to the simulation kernel. */
  public readonly type: number;

  /** Circle diameter or box/cone width; zero for a point. Not a position. */
  public readonly x: SampledCurve;

  /** Box/cone height; zero for a circle or point. Not a position. */
  public readonly y: SampledCurve;

  /** Random half-range added to the first dimension at particle birth. */
  public readonly spreadX: number;

  /** Random half-range added to the second dimension at particle birth. */
  public readonly spreadY: number;

  public constructor(shape: EmitterConfig['emission']['shape']) {
    this.type = SHAPE_TYPES[shape.type];

    switch (shape.type) {
      case 'point':
        this.x = new SampledCurve(0);
        this.y = new SampledCurve(0);
        this.spreadX = 0;
        this.spreadY = 0;
        break;

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
    }
  }
}
