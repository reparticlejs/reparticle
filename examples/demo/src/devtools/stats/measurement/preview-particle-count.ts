import { EmitterPlayback, prewarm, SpawnRate } from '@reparticle/core';

import { emissionRate } from '../../../preview/emission-rate';
import type { PreviewControls } from '../../../types/preview';
import { LiveParticleCount } from './live-particle-count';

/** Replays emitter timing for the overlay, without reading particle textures. */
export class PreviewParticleCount {
  private readonly particles: LiveParticleCount;
  private seed = 1;
  private controls: PreviewControls | undefined;
  private spawnRate = new SpawnRate(0);
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
    if (controls !== this.controls) {
      this.spawnRate = new SpawnRate(emissionRate(controls));
      this.controls = controls;
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
    const rate = active && emitting ? this.spawnRate.at(this.playback!.normalizedAge) : 0;
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
