import type { CurvePoint, ScalarProperty } from '#types/curve.js';

function hermite(left: CurvePoint, right: CurvePoint, time: number): number {
  const width = right.time - left.time;
  const t = (time - left.time) / width;
  const squared = t * t;
  const cubed = squared * t;
  return (
    (2 * cubed - 3 * squared + 1) * left.value +
    (cubed - 2 * squared + t) * width * left.tangent +
    (-2 * cubed + 3 * squared) * right.value +
    (cubed - squared) * width * right.tangent
  );
}

/** Hermite interpolation; endpoint segments also provide extrapolation. */
export function evaluateCurve(property: ScalarProperty, time: number): number {
  if (typeof property === 'number') {
    return property;
  }
  const points = property.points;
  const first = points[0]!;
  if (points.length === 1) {
    return first.value + (time - first.time) * first.tangent;
  }
  for (let index = 1; index < points.length; index++) {
    const right = points[index]!;
    if ((time >= points[index - 1]!.time && time < right.time) || index === points.length - 1) {
      return hermite(points[index - 1]!, right, time);
    }
  }
  return first.value;
}
