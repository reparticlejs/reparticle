import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const emissionSpaceOptions: SelectOption<PreviewControls['space']>[] = [
  { value: 'world', label: 'World' },
  { value: 'local', label: 'Local' },
];
