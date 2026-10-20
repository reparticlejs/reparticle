import type { ParticleTexel } from '#types/layout.js';

import { applyModifiers } from '../modifiers/list';
import { advanceRotation } from './angular-velocity';
import { particleHeading } from './heading';

/**
 * Apply modifiers to velocity, then advance position using that new velocity.
 *
 * Both newborn and surviving particles use this step. The caller supplies age
 * after this step and rotation accumulated before it; newborns start with age
 * equal to seconds and accumulated rotation zero. Expiration is handled by the
 * kernel so a newborn always receives its first step.
 */
export function integrateMotion(
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  age: number,
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
  let velocity: [number, number] = [velocityX, velocityY];
  if (modifiers[0]! > 0) {
    let heading: [number, number] = [0, -1];
    // Only radial modifiers need the particle's orientation-based heading.
    if (modifiers[1]! > 0) {
      let angularRotation = 0;
      if (orientToAngularVelocity > 0.5) {
        angularRotation =
          advanceRotation(
            accumulatedRotation,
            initialAngularVelocity,
            age,
            lifetime,
            angularVelocityCurve,
            seconds,
          ) * handedness;
      }
      heading = particleHeading(
        initialRotation + angularRotation,
        age,
        lifetime,
        rotationCurve,
        velocityX,
        velocityY,
        orientToMovement,
        handedness,
      );
    }
    velocity = applyModifiers(
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
  }
  return [x + velocity[0] * seconds, y + velocity[1] * seconds, velocity[0], velocity[1]];
}
