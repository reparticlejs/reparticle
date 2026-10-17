import { createStatsLifecycle } from './stats/lifecycle/create-stats-lifecycle';
import { runStatsCleanup } from './stats/lifecycle/run-stats-cleanup';
import { createStatsSampler } from './stats/measurement/create-stats-sampler';
import { createStatsView } from './stats/presentation/create-stats-view';
import { createStatsDefinitions } from './stats/stats-metrics';
import { registerWebglContext } from './stats/webgl/context-registry';
import type { StatsOptions } from './types/config';
import type { Stats } from './types/stats';

/** Local source adaptation of Replayable stats, independent of its runtime. */
export function createStats(host: StatsOptions): Stats {
  const metrics = createStatsDefinitions(host.getParticleCount);
  const release = registerWebglContext(host.gl);
  try {
    const display = host.display ?? 'expanded';
    const sampler = createStatsSampler(metrics);
    const view = createStatsView(metrics, display, host.container);
    const stats = createStatsLifecycle(sampler, view, host);
    let destroyed = false;
    return {
      show: () => stats.show(),
      hide: () => stats.hide(),
      destroy() {
        if (destroyed) {
          return;
        }
        destroyed = true;
        runStatsCleanup([() => stats.destroy(), release]);
      },
    };
  } catch (error) {
    release();
    throw error;
  }
}
