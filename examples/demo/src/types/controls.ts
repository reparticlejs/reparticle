import type { Ref } from 'react';

import type { PreviewControls } from './preview';

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
  hostRef: Ref<HTMLDivElement>;
  onPointerMove: (x: number, y: number) => void;
}

export interface PreviewStatusProps {
  controls: PreviewControls | null;
  ready: boolean;
  error: string;
  onChange: (patch: Partial<PreviewControls>) => void;
}
