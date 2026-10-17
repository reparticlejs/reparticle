import type { EmitterConfig } from '@reparticle/core';

export type ColorCurves = Pick<EmitterConfig['overLifetime'], 'red' | 'green' | 'blue'>;

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
  red: number;
  green: number;
  blue: number;
  colorCurve: 'effect' | 'constant' | 'fire' | 'blue-to-pink';
  alpha: number;
  alphaCurve: 'effect' | 'constant' | 'fade-out' | 'fade-in-out';
  size: number;
  sizeCurve: 'effect' | 'constant' | 'shrink' | 'grow-shrink';
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
