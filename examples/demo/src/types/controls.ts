import type { PreviewControls } from './preview';
import type { PreviewController } from './preview-controller';

export interface ControlSectionProps {
  controls: PreviewControls;
  onChange: (patch: Partial<PreviewControls>) => void;
}

export interface EmitterControlsProps extends ControlSectionProps {
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
  ready: boolean;
  error: string;
}

export interface SelectOption<Value extends string | number> {
  value: Value;
  label: string;
}

export interface SelectFieldProps<Value extends string | number> {
  id: string;
  label: string;
  value: Value;
  options: readonly SelectOption<Value>[];
  onChange: (value: Value) => void;
}
