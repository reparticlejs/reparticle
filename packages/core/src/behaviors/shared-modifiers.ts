import { applyAcceleration } from './acceleration';
import { applyDrag } from './drag';
import { applyRadial } from './radial';
import { applyVortex } from './vortex';

/** Apply the shared scope after emitter-local modifiers, without advancing position or age. */
export function applySharedModifiers(
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
  const acceleratedX =
    velocityX + applyAcceleration(values[3]!, values[1]!, values[2]!, factor) * seconds;
  const acceleratedY =
    velocityY + applyAcceleration(values[4]!, values[1]!, values[2]!, factor) * seconds;
  const projection = acceleratedX * values[8]! + acceleratedY * values[9]!;
  const dampedX = applyDrag(
    acceleratedX,
    values[7]! > 0.5 ? projection * values[8]! : acceleratedX,
    values[5]!,
    values[6]!,
    factor,
    seconds,
  );
  const dampedY = applyDrag(
    acceleratedY,
    values[7]! > 0.5 ? projection * values[9]! : acceleratedY,
    values[5]!,
    values[6]!,
    factor,
    seconds,
  );
  const radial = applyRadial(
    x,
    y,
    values[12]!,
    values[13]!,
    headingX,
    headingY,
    values[10]!,
    values[11]!,
    factor,
    values[14]!,
  );
  const vortex = applyVortex(
    x,
    y,
    values[17]!,
    values[18]!,
    values[20]!,
    values[21]!,
    values[15]!,
    values[16]!,
    factor,
    values[19]!,
  );
  return [dampedX + (radial[0] + vortex[0]) * seconds, dampedY + (radial[1] + vortex[1]) * seconds];
}
