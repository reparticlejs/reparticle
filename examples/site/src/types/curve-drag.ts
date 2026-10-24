import type { CurvePoint } from '@reparticle/core';

/** One captured gesture, including the fixed graph scale and latest draft. */
export interface CurveDrag {
  pointerId: number;
  index: number;
  /** Zero moves the point; -1/+1 rotates its left/right tangent handle. */
  tangentSide: number;
  startX: number;
  startY: number;
  minimum: number;
  maximum: number;
  original: CurvePoint[];
  points: CurvePoint[];
}
