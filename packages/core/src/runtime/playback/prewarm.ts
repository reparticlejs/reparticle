const MIN_START_OFFSET = 0.0001;
const PREWARM_STEP_SECONDS = Math.fround(1 / 60);

/**
 * Simulate an effect's start offset before its first visible frame.
 * The caller supplies the normal simulation step, including delay and playback
 * handling, so prewarming can also complete a once-playing emitter.
 *
 * Simulated time is capped at the maximum particle lifetime. Every step is a
 * full 1/60 second, even when less time remains; the final step may overshoot.
 * This fixed startup step is independent of the display's refresh rate.
 */
export function prewarm(
  startOffset: number,
  maximumLifetime: number,
  advance: (seconds: number) => void,
): void {
  if (startOffset < MIN_START_OFFSET) {
    return;
  }

  const duration = Math.fround(Math.min(startOffset, maximumLifetime));
  let elapsed = 0;

  // Preserve float32 accumulation: replacing it with a rounded step count can
  // change the number of steps taken at a duration boundary.
  while (elapsed < duration) {
    advance(PREWARM_STEP_SECONDS);
    elapsed = Math.fround(elapsed + PREWARM_STEP_SECONDS);
  }
}
