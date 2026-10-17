// The sole low-level effect boundary; do not add other import-rule exceptions.
// oxlint-disable-next-line no-restricted-imports
import { useEffect } from 'react';

/**
 * External setup/cleanup tied to this mounted instance, never reactive state syncing.
 * Captures initial values only. Cleanup must tolerate StrictMode's setup/cleanup replay.
 * Use a keyed child when an external resource needs a new instance for a new identity.
 */
export function useMountEffect(setup: () => void | (() => void)) {
  // The initial callback is deliberate; this helper accepts no dependency array.
  // oxlint-disable-next-line react/exhaustive-deps
  useEffect(setup, []);
}
