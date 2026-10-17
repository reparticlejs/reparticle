import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const initialRotationCurveOptions: SelectOption<PreviewControls['initialRotationCurve']>[] =
  [
    { value: 'constant', label: 'Constant' },
    { value: 'effect', label: 'Effect JSON curve' },
    { value: 'ramp-up', label: 'Ramp up' },
    { value: 'fade-out', label: 'Fade out' },
  ];
