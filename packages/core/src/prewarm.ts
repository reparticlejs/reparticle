/** Defold start offsets use full 60 Hz steps, capped at the maximum particle lifetime. */
export function prewarm(
  offset: number,
  lifetime: number,
  advance: (seconds: number) => void,
): void {
  if (offset < 0.0001) {
    return;
  }
  const duration = Math.fround(Math.min(offset, lifetime));
  const seconds = Math.fround(1 / 60);
  // Defold accumulates this timer as float32, including its final full step.
  for (let elapsed = 0; elapsed < duration; elapsed = Math.fround(elapsed + seconds)) {
    advance(seconds);
  }
}
