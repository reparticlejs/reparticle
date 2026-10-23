import type { Example } from './example';

export interface ExampleSelectProps {
  example: Example;
  disabled: boolean;
  onSelect: (example: Example) => void;
}
