export type ParticleTextureName = 'star' | 'leaf' | 'spark' | 'procedural';

export interface PreviewControls {
  capacity: number;
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
  update(patch: Partial<PreviewControls>): PreviewControls;
  movePointer(clientX: number, clientY: number): void;
  reset(): void;
  destroy(): void;
}
