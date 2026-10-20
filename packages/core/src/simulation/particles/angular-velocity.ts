/** Integrate birth angular velocity times the particle-lifetime multiplier. */
export function advanceRotation(
  rotation: number,
  angularVelocity: number,
  age: number,
  lifetime: number,
  curve: Float32Array,
  seconds: number,
): number {
  const normalizedAge = lifetime > 0 ? Math.max(0, Math.min(1, age / lifetime)) : 0;
  const position = normalizedAge * 64;
  const segment = Math.min(Math.floor(position), 63);
  const left = curve[segment]!;
  const multiplier = left + (curve[segment + 1]! - left) * (position - segment);
  return rotation + angularVelocity * multiplier * seconds;
}
