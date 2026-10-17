import { EmitterPlayback, prewarm } from '@reparticle/core';

import type { PreviewControls } from '../../../types/preview';
import { LiveParticleCount } from './live-particle-count';

/** Replays emitter timing for the overlay, without reading particle textures. */
export class PreviewParticleCount {
  private readonly particles: LiveParticleCount;
  private playback: EmitterPlayback | undefined;

  constructor(capacity: number) {
    this.particles = new LiveParticleCount(capacity);
  }

  get count(): number {
    return this.particles.count;
  }

  advance(seconds: number, controls: PreviewControls, emitting: boolean): void {
    if (seconds === 0) {
      return;
    }
    if (!this.playback) {
      this.playback = new EmitterPlayback(
        controls.duration,
        controls.playMode,
        controls.startDelay,
      );
      prewarm(controls.startOffset, controls.lifetime, (step) =>
        this.step(step, controls, emitting),
      );
    }
    this.step(seconds, controls, emitting);
  }

  private step(seconds: number, controls: PreviewControls, emitting: boolean): void {
    const active = this.playback?.advance(seconds);
    const rate = active && emitting ? controls.rate : 0;
    this.particles.advance(seconds, rate, controls.lifetime);
  }
}
