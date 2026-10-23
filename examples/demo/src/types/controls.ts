import type { Example } from './example';

export interface ExampleSelectProps {
  example: Example;
  disabled: boolean;
  onSelect: (example: Example) => void;
}

export interface PlaybackControlsProps {
  paused: boolean;
  disabled: boolean;
  onToggle: () => void;
  onRestart: () => void;
}
