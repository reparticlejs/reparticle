import { dispatchModifier } from './dispatch';

/**
 * Apply the packed modifier list in order. Each entry receives the velocity
 * produced by the previous one; position advances only after the entire list.
 * The runtime writes emitter modifiers first, followed by effect modifiers.
 */
export function applyModifiers(
  x: number,
  y: number,
  velocityX: number,
  velocityY: number,
  headingX: number,
  headingY: number,
  spreadFactor: number,
  seconds: number,
  modifiers: Float32Array,
): [number, number] {
  const count = modifiers[0]!;
  const headerSize = 2;
  const recordSize = 9;
  const position: [number, number] = [x, y];
  const heading: [number, number] = [headingX, headingY];
  let velocity: [number, number] = [velocityX, velocityY];

  // Fixed GPU loop bound: up to 64 emitter and 64 effect modifiers.
  for (let index = 0; index < 128; index++) {
    if (index >= count) {
      break;
    }
    const offset = headerSize + index * recordSize;
    velocity = dispatchModifier(
      position,
      velocity,
      heading,
      spreadFactor,
      seconds,
      modifiers,
      offset,
    );
  }

  return velocity;
}
