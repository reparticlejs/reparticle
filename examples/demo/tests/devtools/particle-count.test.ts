import { expect, it, vi } from 'vitest';

import { createParticleCountMetric } from '#src/devtools/stats/measurement/metrics/create-particle-count-metric.js';

it('reads the live source only at refresh and retains its range across resets', () => {
  const read = vi.fn<() => number>().mockReturnValue(123);
  const metric = createParticleCountMetric(read);
  metric.start();
  metric.measure(16, 100);
  expect(read).not.toHaveBeenCalled();
  expect(metric.collect()).toMatchObject({ value: 123, graphValue: 123 });
  read.mockReturnValue(0);
  metric.reset();
  expect(metric.collect()).toMatchObject({ value: 0, range: { min: 0, max: 123 } });
});
