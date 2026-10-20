/** Uniform direction around the full circle. */
export function circleAngle(sample: number): number {
  return sample * 6.283185307179586;
}

/** Square-root radius sampling distributes births uniformly across the disk area. */
export function circleRadius(sample: number, diameter: number): number {
  return Math.sqrt(sample) * diameter * 0.5;
}
