export type EmitterShape = 'point' | 'circle' | 'box';

export type ParticleTextureName = 'star' | 'leaf' | 'spark' | 'procedural';

export interface PreviewControls {
  capacity: number;
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
