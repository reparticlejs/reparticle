import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const orientationOptions: SelectOption<PreviewControls['orientation']>[] = [
  { value: 'default', label: 'Default' },
  { value: 'initial-direction', label: 'Initial direction' },
  { value: 'movement-direction', label: 'Movement direction' },
];
