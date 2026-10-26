import type { ScalarProperty } from '@reparticle/core';

import type { Property } from './property';

export interface CurveControlProps {
  property: Property;
  value: unknown;
  disabled: boolean;
  onChange: (value: ScalarProperty) => void;
}
