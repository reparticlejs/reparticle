export type EmitterShape = 'point' | 'circle' | 'box' | 'cone2d';

export type ParticleTextureName = 'star' | 'leaf' | 'spark' | 'procedural';

export interface PreviewControls {
  capacity: number;
  startOffset: number;
  startDelay: number;
  duration: number;
  playMode: 'once' | 'loop';
  shape: EmitterShape;
  diameter: number;
  width: number;
  height: number;
  texture: ParticleTextureName;
  size: number;
  rate: number;
  gravity: number;
  lifetime: number;
  paused: boolean;
  statsVisible: boolean;
}

export interface ParticlePreview {
  readonly controls: PreviewControls;
  setControls(patch: Partial<PreviewControls>): PreviewControls;
  movePointer(clientX: number, clientY: number): void;
  reset(): void;
  destroy(): void;
}
