import { applyAcceleration } from './acceleration';
import { applyDrag } from './drag';
import { applyRadial } from './radial';
import { applyVortex } from './vortex';

/** Sequential velocity changes; position advances once after the entire list. */
export function applyModifiers(
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  headingX: number,
  headingY: number,
  factor: number,
  seconds: number,
  values: Float32Array,
): [number, number] {
  let resultX = velocityX;
  let resultY = velocityY;
  for (let index = 0; index < 128; index++) {
    if (index >= values[0]!) {
      break;
    }
    const offset = 2 + index * 9;
    const type = values[offset]!;
    const magnitude = values[offset + 1]!;
    const spread = values[offset + 2]!;
    const centerX = values[offset + 3]!;
    const centerY = values[offset + 4]!;
    const directionX = values[offset + 5]!;
    const directionY = values[offset + 6]!;
    const cutoff = values[offset + 7]!;
    if (type === 0) {
      resultX += applyAcceleration(directionX, magnitude, spread, factor) * seconds;
      resultY += applyAcceleration(directionY, magnitude, spread, factor) * seconds;
    } else if (type === 1) {
      const projection = resultX * directionX + resultY * directionY;
      const directional = values[offset + 8]!;
      resultX = applyDrag(
        resultX,
        directional > 0.5 ? projection * directionX : resultX,
        magnitude,
        spread,
        factor,
        seconds,
      );
      resultY = applyDrag(
        resultY,
        directional > 0.5 ? projection * directionY : resultY,
        magnitude,
        spread,
        factor,
        seconds,
      );
    } else if (type === 2) {
      const radial = applyRadial(
        x,
        y,
        centerX,
        centerY,
        headingX,
        headingY,
        magnitude,
        spread,
        factor,
        cutoff,
      );
      resultX += radial[0] * seconds;
      resultY += radial[1] * seconds;
    } else if (type === 3) {
      const vortex = applyVortex(
        x,
        y,
        centerX,
        centerY,
        directionX,
        directionY,
        magnitude,
        spread,
        factor,
        cutoff,
      );
      resultX += vortex[0] * seconds;
      resultY += vortex[1] * seconds;
    }
  }
  return [resultX, resultY];
}
