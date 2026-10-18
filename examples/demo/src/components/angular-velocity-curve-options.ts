import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const angularVelocityCurveOptions: SelectOption<PreviewControls['angularVelocityCurve']>[] =
  [
    { value: 'effect', label: 'Effect JSON curve' },
    { value: 'constant', label: 'Constant speed (×1)' },
    { value: 'speed-up', label: 'Speed up (×0 → ×1)' },
    { value: 'slow-down', label: 'Slow down (×1 → ×0)' },
    { value: 'reverse', label: 'Reverse (×1 → ×−1)' },
  ];
