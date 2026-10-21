import { CURVE_SEGMENTS, sampleCurve, type EmitterConfig } from '@reparticle/core';

/**
 * Build the vertex shader's colorCurve uniform array from validated lifetime properties.
 * Each vec4 stores [red, green, blue, alpha] multipliers at one normalized particle age.
 * Samples include birth (0) and the end of life (1).
 *
 * The shader interpolates adjacent vec4 samples and multiplies the particle's initial
 * color by the result. Packing four channels together saves vertex uniform slots.
 * Sampling and allocation happen when emitter rendering resources are created.
 */
export function packColorCurves(properties: EmitterConfig['overLifetime']): Float32Array {
  const red = sampleCurve(properties.red);
  const green = sampleCurve(properties.green);
  const blue = sampleCurve(properties.blue);
  const alpha = sampleCurve(properties.alpha);

  const sampleCount = CURVE_SEGMENTS + 1;
  const componentsPerSample = 4;
  const packed = new Float32Array(sampleCount * componentsPerSample);

  for (let sample = 0; sample < sampleCount; sample++) {
    const offset = sample * componentsPerSample;
    packed[offset] = red[sample]!;
    packed[offset + 1] = green[sample]!;
    packed[offset + 2] = blue[sample]!;
    packed[offset + 3] = alpha[sample]!;
  }

  return packed;
}
