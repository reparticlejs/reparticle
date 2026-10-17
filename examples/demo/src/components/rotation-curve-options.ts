import type { SelectOption } from '../types/controls';
import type { PreviewControls } from '../types/preview';

export const rotationCurveOptions: SelectOption<PreviewControls['rotationCurve']>[] = [
  { value: 'effect', label: 'Effect JSON curve' },
  { value: 'constant', label: 'No added rotation' },
  { value: 'full-turn', label: 'One turn counterclockwise' },
  { value: 'reverse-turn', label: 'One turn clockwise' },
];
