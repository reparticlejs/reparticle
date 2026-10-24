import type { Curve } from '@reparticle/core';

export interface CurveEditorProps {
  curve: Curve;
  label: string;
  clock: 'emitter' | 'particle' | 'modifier';
  range?: [number, number];
  disabled: boolean;
  onApply: (curve: Curve) => void;
}
