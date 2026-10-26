import type { Example } from '@reparticle/player/types';

export interface ExampleSelectProps {
  example: Example;
  disabled: boolean;
  onSelect: (example: Example) => void;
}
