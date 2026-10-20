import type { CurvePoint, ScalarProperty } from '#types/curve.js';

/**
 * Blend two points using their values and slopes (cubic Hermite interpolation).
 * Tangents are slopes per unit of curve time, so their contributions are scaled
 * by the segment duration. Progress is not clamped, allowing extrapolation.
 */
function interpolateSegment(left: CurvePoint, right: CurvePoint, time: number): number {
  const duration = right.time - left.time;
  const progress = (time - left.time) / duration;
  const squared = progress * progress;
  const cubed = squared * progress;

  const leftValueWeight = 2 * cubed - 3 * squared + 1;
  const leftSlopeWeight = cubed - 2 * squared + progress;
  const rightValueWeight = -2 * cubed + 3 * squared;
  const rightSlopeWeight = cubed - squared;

  return (
    leftValueWeight * left.value +
    leftSlopeWeight * duration * left.tangent +
    rightValueWeight * right.value +
    rightSlopeWeight * duration * right.tangent
  );
}

/**
 * Evaluate a constant or an authored curve at the supplied time.
 *
 * Expects validated data: at least one point, with strictly increasing times.
 * A single point defines a straight line through its value with its tangent.
 * Multiple points use the segment containing time, including its left endpoint.
 * The final segment is the fallback when no earlier segment matches, including
 * times before the first point or after the last. Neither time nor output is clamped.
 */
export function evaluateCurve(property: ScalarProperty, time: number): number {
  if (typeof property === 'number') {
    return property;
  }

  const points = property.points;
  const first = points[0]!;

  if (points.length === 1) {
    const elapsed = time - first.time;
    return first.value + elapsed * first.tangent;
  }

  const lastIndex = points.length - 1;
  for (let index = 1; index < lastIndex; index++) {
    const left = points[index - 1]!;
    const right = points[index]!;
    const containsTime = time >= left.time && time < right.time;

    if (containsTime) {
      return interpolateSegment(left, right, time);
    }
  }

  return interpolateSegment(points[lastIndex - 1]!, points[lastIndex]!, time);
}
