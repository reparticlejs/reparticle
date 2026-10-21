import type { StatsMetricDefinition } from '../types/metric.js';
import { createFpsMetric } from './measurement/metrics/create-fps-metric.js';
import { createFrameIntervalMetric } from './measurement/metrics/create-frame-interval-metric.js';
import { createJsHeapMetric } from './measurement/metrics/create-js-heap-metric.js';
import { createParticleCountMetric } from './measurement/metrics/create-particle-count-metric';
import { createWebglMetric } from './measurement/metrics/create-webgl-metric.js';

/**
 * The single built-in registry: order, presentation, and measurement factory.
 * Add a metric implementation here; sampler, lifecycle, and cards need no edits.
 * A new authored toggle also belongs in config's strict stats schema and runtime type.
 */
export function createStatsDefinitions(
  readParticleCount: () => number,
): readonly StatsMetricDefinition[] {
  return [
    {
      key: 'particleCount',
      label: 'Particles',
      description: 'Living particles from CPU draw ordering, without GPU readbacks.',
      ceiling: 10000,
      decimals: 0,
      initiallyAvailable: true,
      create: () => createParticleCountMetric(readParticleCount),
    },
    {
      key: 'fps',
      label: 'FPS',
      description: '',
      ceiling: 120,
      initiallyAvailable: true,
      create: createFpsMetric,
    },
    {
      key: 'frameInterval',
      label: 'Frame · ms',
      description: '',
      ceiling: 100,
      initiallyAvailable: true,
      create: createFrameIntervalMetric,
    },
    {
      key: 'jsHeap',
      label: 'JS heap · MB',
      description: 'Approximate browser-reported JS heap; not total playable memory.',
      ceiling: 64,
      initiallyAvailable: false,
      create: createJsHeapMetric,
    },
    {
      key: 'drawCalls',
      label: 'Draw calls',
      description:
        'Submitted draws per frame; instanced draws count once, multi-draw counts each draw.',
      ceiling: 100,
      initiallyAvailable: false,
      create: () => createWebglMetric('drawCalls'),
    },
    {
      key: 'textureBinds',
      label: 'Texture binds',
      description: 'bindTexture calls per frame, including repeated bindings and null unbindings.',
      ceiling: 100,
      initiallyAvailable: false,
      create: () => createWebglMetric('textureBinds'),
    },
    {
      key: 'programUses',
      label: 'Program uses',
      description: 'useProgram calls per frame, not unique programs or shaders.',
      ceiling: 100,
      initiallyAvailable: false,
      create: () => createWebglMetric('programUses'),
    },
  ];
}
