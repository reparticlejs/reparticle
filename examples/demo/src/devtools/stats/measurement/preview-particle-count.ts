import { EmitterPlayback, prewarm } from '@reparticle/core';

import type { PreviewControls } from '../../../types/preview';
import { LiveParticleCount } from './live-particle-count';

/** Replays emitter timing for the overlay, without reading particle textures. */
export class PreviewParticleCount {
  private readonly particles: LiveParticleCount;
  private seed = 1;
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
      this.seed = controls.seed;
      this.playback = new EmitterPlayback(
        controls.duration,
        controls.playMode,
        controls.startDelay,
      );
      prewarm(controls.startOffset, controls.lifetime + controls.lifetimeSpread, (step) =>
        this.step(step, controls, emitting),
      );
    }
    this.step(seconds, controls, emitting);
  }

  private step(seconds: number, controls: PreviewControls, emitting: boolean): void {
    const active = this.playback?.advance(seconds);
    const rate = active && emitting ? controls.rate : 0;
    const spawned = this.particles.advance(
      seconds,
      rate,
      controls.lifetime,
      controls.lifetimeSpread,
      this.seed,
    );
    if (spawned) {
      this.seed = (this.seed + 1) % 65536;
    }
  }
}
