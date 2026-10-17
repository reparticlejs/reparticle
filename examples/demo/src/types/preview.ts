import type { EmitterConfig, ScalarProperty } from '@reparticle/core';

export type ColorCurves = Pick<EmitterConfig['overLifetime'], 'red' | 'green' | 'blue'>;

export type EmitterShape = 'point' | 'circle' | 'box' | 'cone2d';

export type ParticleTextureName = 'star' | 'leaf' | 'spark' | 'procedural';

export interface PreviewControls {
  capacity: number;
  startOffset: number;
  startDelay: number;
  startDelaySpread: number;
  durationSpread: number;
  duration: number;
  orientation: 'default' | 'initial-direction' | 'movement-direction';
  playMode: 'once' | 'loop';
  shape: EmitterShape;
  diameter: number;
  diameterSpread: number;
  diameterCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectDiameter: ScalarProperty;
  width: number;
  widthSpread: number;
  widthCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectWidth: ScalarProperty;
  height: number;
  heightSpread: number;
  heightCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectHeight: ScalarProperty;
  texture: ParticleTextureName;
  red: number;
  initialRedCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectRed: EmitterConfig['initial']['red'];
  green: number;
  initialGreenCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectGreen: EmitterConfig['initial']['green'];
  blue: number;
  initialBlueCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectBlue: EmitterConfig['initial']['blue'];
  colorCurve: 'effect' | 'constant' | 'fire' | 'blue-to-pink';
  alpha: number;
  initialAlphaCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectAlpha: EmitterConfig['initial']['alpha'];
  alphaCurve: 'effect' | 'constant' | 'fade-out' | 'fade-in-out';
  rotation: number;
  initialRotationCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectRotation: EmitterConfig['initial']['rotation'];
  rotationCurve: 'effect' | 'constant' | 'full-turn' | 'reverse-turn';
  size: number;
  initialSizeCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectSize: EmitterConfig['initial']['size'];
  sizeSpread: number;
  redSpread: number;
  greenSpread: number;
  blueSpread: number;
  alphaSpread: number;

  rotationSpread: number;
  sizeCurve: 'effect' | 'constant' | 'shrink' | 'grow-shrink';
  rate: number;
  rateSpread: number;
  rateCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectRate: EmitterConfig['emission']['rate'];
  radial: number;
  radialSpread: number;
  radialX: number;
  radialY: number;
  radialMaxDistance: number;
  radialCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectRadial: ScalarProperty;
  acceleration: number;
  accelerationSpread: number;
  accelerationRotation: number;
  accelerationCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectAcceleration: EmitterConfig['modifiers']['acceleration']['magnitude'];
  drag: number;
  dragSpread: number;
  dragDirectional: boolean;
  dragRotation: number;
  dragCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectDrag: EmitterConfig['modifiers']['drag']['magnitude'];
  inheritVelocity: number;
  emitterRotation: number;
  emitterScale: number;
  space: 'world' | 'local';
  lifetime: number;
  initialLifetimeCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectLifetime: EmitterConfig['initial']['lifetime'];
  speed: number;
  speedCurve: 'constant' | 'effect' | 'ramp-up' | 'fade-out';
  effectSpeed: EmitterConfig['initial']['speed'];
  speedSpread: number;
  lifetimeSpread: number;
  seed: number;
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
