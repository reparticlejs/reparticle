import type { StatsConfig } from '../../types/config.js';
import type { StatsShellElements } from '../../types/shell-elements.js';

import styles from './stats.scss?inline';

/** Builds the unmounted shell and stylesheet without installing input listeners. */
export function createStatsShellElements(
  cardElements: readonly HTMLElement[],
  display: StatsConfig['display'],
): StatsShellElements {
  const root = document.createElement('aside');
  root.className = 'replayable-stats';
  root.setAttribute('aria-label', 'Development stats');
  root.classList.toggle('replayable-stats--compact', display === 'compact');
  root.append(...cardElements);

  // Each shell owns its style node, so destroying one instance leaves others intact.
  const style = document.createElement('style');
  style.textContent = styles;

  return { root, style };
}
