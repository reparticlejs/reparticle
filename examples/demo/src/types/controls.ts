import type { PreviewControls } from './preview';
import type { PreviewController } from './preview-controller';

export interface EmitterControlsProps {
  controls: PreviewControls;
  disabled: boolean;
  onChange: (patch: Partial<PreviewControls>) => void;
  onReset: () => void;
}

export interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}

export interface ParticlePreviewProps {
  controller: PreviewController;
}

export interface PreviewStatusProps {
  controls: PreviewControls | null;
  ready: boolean;
  error: string;
}
