import { createStatsLifecycle } from './stats/lifecycle/create-stats-lifecycle';
import { runStatsCleanup } from './stats/lifecycle/run-stats-cleanup';
import { createStatsSampler } from './stats/measurement/create-stats-sampler';
import { createStatsView } from './stats/presentation/create-stats-view';
import { STATS_METRICS } from './stats/stats-metrics';
import { registerWebglContext } from './stats/webgl/context-registry';
import type { StatsConfig } from './types/config';
import type { StatsHost } from './types/host';
import type { Stats } from './types/stats';

/** Local source adaptation of Replayable stats, independent of its runtime. */
export function createStats(
  host: StatsHost & {
    container: HTMLElement;
    gl: WebGL2RenderingContext;
    display?: StatsConfig['display'];
  },
): Stats {
  const release = registerWebglContext(host.gl);
  try {
    const stats = createStatsLifecycle(
      createStatsSampler(STATS_METRICS),
      createStatsView(STATS_METRICS, host.display ?? 'expanded', host.container),
      host,
    );
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
