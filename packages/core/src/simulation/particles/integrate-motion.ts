import type { ParticleTexel } from '#types/layout.js';

import { applyModifiers } from '../modifiers/list';
import { advanceRotation } from './angular-velocity';
import { particleHeading } from './heading';

/**
 * Advance one particle with semi-implicit Euler integration:
 * apply modifiers to velocity first, then move using the resulting velocity.
 *
 * Both newborn and surviving particles use this step. The caller supplies age
 * after this step and rotation accumulated before it; newborns start with age
 * equal to seconds and accumulated rotation zero. Expiration is handled by the
 * kernel so a newborn always receives its first step.
 *
 * Position is in simulation units, velocity in units per second, and rotations
 * in degrees. Return [x, y, velocityX, velocityY]. This function does not update
 * stored age or rotation; their texture bands are written separately.
 */
export function integrateMotion(
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  ageAfterStep: number,
  lifetime: number,
  initialRotation: number,
  accumulatedRotation: number,
  initialAngularVelocity: number,
  spreadFactor: number,
  handedness: number,
  seconds: number,
  orientToMovement: number,
  orientToAngularVelocity: number,
  rotationCurve: Float32Array,
  angularVelocityCurve: Float32Array,
  modifiers: Float32Array,
): ParticleTexel {
  const modifierCount = modifiers[0]!;
  if (modifierCount === 0) {
    return [x + velocityX * seconds, y + velocityY * seconds, velocityX, velocityY];
  }

  // Only radial modifiers need a heading for particles exactly at their center.
  const containsRadial = modifiers[1]!;
  let heading: [number, number] = [0, -1];
  if (containsRadial > 0) {
    let angularRotation = 0;
    if (orientToAngularVelocity > 0.5) {
      const rotationAfterStep = advanceRotation(
        accumulatedRotation,
        initialAngularVelocity,
        ageAfterStep,
        lifetime,
        angularVelocityCurve,
        seconds,
      );
      angularRotation = rotationAfterStep * handedness;
    }

    // Use this step's rotation but the velocity before modifiers change it.
    const baseRotation = initialRotation + angularRotation;
    heading = particleHeading(
      baseRotation,
      ageAfterStep,
      lifetime,
      rotationCurve,
      velocityX,
      velocityY,
      orientToMovement,
      handedness,
    );
  }

  const nextVelocity = applyModifiers(
    x,
    y,
    velocityX,
    velocityY,
    heading[0],
    heading[1],
    spreadFactor,
    seconds,
    modifiers,
  );
  const nextX = x + nextVelocity[0] * seconds;
  const nextY = y + nextVelocity[1] * seconds;

  return [nextX, nextY, nextVelocity[0], nextVelocity[1]];
}
