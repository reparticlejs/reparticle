import type { StatsMetric, StatsReading } from '../../../types/metric';
import { createStatsRange } from '../create-stats-range';

/** Samples a CPU-side count only when the stats display refreshes. */
export function createParticleCountMetric(readCount: () => number): StatsMetric {
  const range = createStatsRange();
  return { start: noop, stop: noop, measure: noop, reset: noop, collect };

  function collect(): StatsReading {
    const value = readCount();
    range.observe(value);
    return { value, graphValue: value, range: range.current };
  }
}

function noop(): void {}
