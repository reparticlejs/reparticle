import type { Example } from './example';

export interface PlayerProps {
  initialExample: Example;
  examples?: readonly Example[];
  gallery?: boolean;
}
