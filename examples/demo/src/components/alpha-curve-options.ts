import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const alphaCurveOptions: SelectOption<PreviewControls['alphaCurve']>[] = [
  { value: 'effect', label: 'Effect JSON curve' },
  { value: 'constant', label: 'Constant' },
  { value: 'fade-out', label: 'Fade out' },
  { value: 'fade-in-out', label: 'Fade in and out' },
];
