import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const colorCurveOptions: SelectOption<PreviewControls['colorCurve']>[] = [
  { value: 'effect', label: 'Effect JSON curves' },
  { value: 'constant', label: 'Constant' },
  { value: 'fire', label: 'Yellow to red' },
  { value: 'blue-to-pink', label: 'Blue to pink' },
];
