/**
 * Attempts every cleanup in the supplied order, then reports failures.
 * Callers clear retained ownership before invoking this function, so a failed
 * cleanup cannot leave a stale subscription handle or block later destruction.
 * A single failure keeps its original identity; multiple failures are preserved.
 */
export function runCleanup(actions: readonly (() => void)[]): void {
  const errors: unknown[] = [];
  for (const action of actions) {
    try {
      action();
    } catch (error) {
      errors.push(error);
    }
  }

  if (errors.length === 1) {
    throw errors[0];
  }
  if (errors.length > 1) {
    throw new AggregateError(errors, 'Failed to release every resource.');
  }
}
