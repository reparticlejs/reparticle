import type { ControlSectionProps } from '../types/controls';
import { StretchAxisControls } from './stretch-axis-controls';

export function StretchControls(props: ControlSectionProps) {
  return (
    <fieldset>
      <legend>Stretch</legend>
      <StretchAxisControls axis="X" {...props} />
      <StretchAxisControls axis="Y" {...props} />
      <p>
        Birth and lifetime stretch add together: 0 keeps the size, 1 doubles it, −1 collapses it.
        Lower values flip that axis.
      </p>
    </fieldset>
  );
}
