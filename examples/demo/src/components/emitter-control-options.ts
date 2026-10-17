import type { SelectOption } from '../types/controls';
import type { ParticleTextureName, EmitterShape } from '../types/preview';

export const capacityOptions: SelectOption<number>[] = [
  { value: 8192, label: '8,192 slots' },
  { value: 100000, label: '100,000 slots' },
];

export const textureOptions: SelectOption<ParticleTextureName>[] = [
  { value: 'star', label: 'Gold star' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'spark', label: 'Blue spark' },
  { value: 'procedural', label: 'Soft circle (procedural)' },
];

export const shapeOptions: SelectOption<EmitterShape>[] = [
  { value: 'point', label: 'Point' },
  { value: 'circle', label: 'Circle' },
  { value: 'box', label: 'Box' },
  { value: 'cone2d', label: '2D cone' },
];
