import type { SelectOption } from '../types/controls';
import type { ParticleTextureName, EmitterShape, PreviewControls } from '../types/preview';

export const capacityOptions: SelectOption<number>[] = [
  { value: 8192, label: '8,192 slots' },
  { value: 100000, label: '100,000 slots' },
];

export const textureOptions: SelectOption<ParticleTextureName>[] = [
  { value: 'star', label: 'Gold star' },
  { value: 'leaf', label: 'Leaf' },
  { value: 'spark', label: 'Blue spark' },
  { value: 'flipbook', label: 'Atlas animation · loop' },
  { value: 'flipbook-once', label: 'Atlas animation · once over lifetime' },
  { value: 'flipbook-pingpong', label: 'Atlas animation · ping-pong' },
  { value: 'procedural', label: 'Soft circle (procedural)' },
];

export const shapeOptions: SelectOption<EmitterShape>[] = [
  { value: 'point', label: 'Point' },
  { value: 'circle', label: 'Circle' },
  { value: 'box', label: 'Box' },
  { value: 'cone2d', label: '2D cone' },
];

export const playModeOptions: SelectOption<PreviewControls['playMode']>[] = [
  { value: 'once', label: 'Once' },
  { value: 'loop', label: 'Loop' },
];

export const blendModeOptions: SelectOption<PreviewControls['blendMode']>[] = [
  { value: 'alpha', label: 'Alpha' },
  { value: 'add', label: 'Add' },
  { value: 'multiply', label: 'Multiply' },
  { value: 'screen', label: 'Screen' },
];
