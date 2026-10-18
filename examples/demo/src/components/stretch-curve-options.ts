import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const stretchCurveOptions: SelectOption<PreviewControls['stretchXCurve']>[] = [
  { value: 'effect', label: 'Effect JSON curve' },
  { value: 'constant', label: 'No added stretch' },
  { value: 'grow', label: 'Grow (0 → 1)' },
  { value: 'shrink', label: 'Shrink (0 → −1)' },
  { value: 'mirror', label: 'Flip through zero (0 → −2)' },
];
