import type { ParticlePreview, PreviewControls } from './preview';

export interface PreviewControllerEvents {
  onChange: (controls: PreviewControls) => void;
  onError: (message: string) => void;
}

export interface PreviewController {
  attach: (preview: ParticlePreview) => () => void;
  update: (patch: Partial<PreviewControls>) => void;
  reset: () => void;
  movePointer: (x: number, y: number) => void;
  reportError: (message: string) => void;
}
