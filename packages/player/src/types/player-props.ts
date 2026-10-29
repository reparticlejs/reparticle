import type { Example } from './example';

export interface PlayerProps {
  initialExample: Example;
  examples?: readonly Example[];
  gallery?: boolean;
  /** Canvas only, with no controls, stats, border, or background. */
  immersive?: boolean;
}
