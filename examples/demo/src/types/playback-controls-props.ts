export interface PlaybackControlsProps {
  paused: boolean;
  disabled: boolean;
  onToggle: () => void;
  onRestart: () => void;
}
