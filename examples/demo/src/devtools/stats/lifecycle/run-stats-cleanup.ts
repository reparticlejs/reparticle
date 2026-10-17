export { runCleanup as runStatsCleanup } from '../../../utils/run-cleanup';

/** Preserves the setup failure even when rolling back acquired resources also fails. */
export function failStatsSetup(cause: unknown, cleanup: () => void): never {
  const errors = [cause];
  try {
    cleanup();
  } catch (cleanupError) {
    errors.push(cleanupError);
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Stats setup and cleanup both failed.', { cause });
  }
  throw cause;
}
