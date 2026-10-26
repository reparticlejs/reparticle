/** One documented effect field and a small, reproducible experiment for it. */
export interface Property {
  path: string;
  label?: string;
  /** Clock used when this scalar is authored as a curve. */
  curve?: 'emitter' | 'particle' | 'modifier';
  /** Documentation-only entries have no lab experiment. */
  lab?: false;
  /** Show this control only when the named sibling is enabled. */
  visibleWhen?: string;
  /** Related fields edited together; their paths remain the actual config paths. */
  fields?: Property[];
  group: string;
  description: string;
  default: string;
  value: unknown;
  unit?: string;
  range?: [number, number, number];
  choices?: string[];
  /** Additional emitter fields needed to make this property visible. */
  setup?: Record<string, unknown>;
}
