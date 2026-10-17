import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const sizeCurveOptions: SelectOption<PreviewControls['sizeCurve']>[] = [
  { value: 'effect', label: 'Effect JSON curve' },
  { value: 'constant', label: 'Constant' },
  { value: 'shrink', label: 'Shrink' },
  { value: 'grow-shrink', label: 'Grow then shrink' },
];
