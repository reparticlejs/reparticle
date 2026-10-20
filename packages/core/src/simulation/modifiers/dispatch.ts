import { applyAcceleration } from './acceleration';
import { applyDragVelocity } from './drag';
import { applyRadial } from './radial';
import { applyVortex } from './vortex';

/**
 * Read one packed record and apply it to velocity.
 * Record layout matches runtime/modifiers/list.ts:
 * [type, magnitude, spread, centerX, centerY, directionX, directionY, cutoff, directional].
 * The vectors compile to shader values, not per-particle JavaScript objects.
 */
export function dispatchModifier(
  position: [number, number],
  velocity: [number, number],
  heading: [number, number],
  spreadFactor: number,
  seconds: number,
  modifiers: Float32Array,
  offset: number,
): [number, number] {
  const accelerationType = 0;
  const dragType = 1;
  const radialType = 2;
  const vortexType = 3;
  const type = modifiers[offset]!;
  const magnitude = modifiers[offset + 1]!;
  const spread = modifiers[offset + 2]!;
  const directionX = modifiers[offset + 5]!;
  const directionY = modifiers[offset + 6]!;

  if (type === accelerationType) {
    return [
      velocity[0] + applyAcceleration(directionX, magnitude, spread, spreadFactor) * seconds,
      velocity[1] + applyAcceleration(directionY, magnitude, spread, spreadFactor) * seconds,
    ];
  }

  if (type === dragType) {
    const directional = modifiers[offset + 8]!;
    return applyDragVelocity(
      velocity,
      [directionX, directionY],
      magnitude,
      spread,
      spreadFactor,
      seconds,
      directional,
    );
  }

  const centerX = modifiers[offset + 3]!;
  const centerY = modifiers[offset + 4]!;
  const maxDistance = modifiers[offset + 7]!;
  let acceleration: [number, number] = [0, 0];

  if (type === radialType) {
    // At the center, radial acceleration follows the particle's heading.
    acceleration = applyRadial(
      position[0],
      position[1],
      centerX,
      centerY,
      heading[0],
      heading[1],
      magnitude,
      spread,
      spreadFactor,
      maxDistance,
    );
  } else if (type === vortexType) {
    // At the center, vortex acceleration uses the modifier's direction.
    acceleration = applyVortex(
      position[0],
      position[1],
      centerX,
      centerY,
      directionX,
      directionY,
      magnitude,
      spread,
      spreadFactor,
      maxDistance,
    );
  } else {
    return velocity;
  }

  return [velocity[0] + acceleration[0] * seconds, velocity[1] + acceleration[1] * seconds];
}
