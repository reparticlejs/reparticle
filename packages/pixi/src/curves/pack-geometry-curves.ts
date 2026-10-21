import { CURVE_SEGMENTS, sampleCurve, type EmitterConfig } from '@reparticle/core';

/**
 * Build the vertex shader's geometryCurve uniform array from validated lifetime properties.
 * Each vec4 stores [scale, rotation, stretchX, stretchY] at one normalized particle age.
 * Samples include birth (0) and the end of life (1).
 *
 * After interpolation, scale multiplies initial size, rotation supplies the lifetime
 * rotation in degrees, and stretchX/Y add to initial stretch. Packing these values
 * together saves vertex uniform slots. Sampling and allocation happen when emitter
 * rendering resources are created.
 */
export function packGeometryCurves(properties: EmitterConfig['overLifetime']): Float32Array {
  const scale = sampleCurve(properties.scale);
  const rotation = sampleCurve(properties.rotation);
  const stretchX = sampleCurve(properties.stretchX);
  const stretchY = sampleCurve(properties.stretchY);

  const sampleCount = CURVE_SEGMENTS + 1;
  const componentsPerSample = 4;
  const packed = new Float32Array(sampleCount * componentsPerSample);

  for (let sample = 0; sample < sampleCount; sample++) {
    const offset = sample * componentsPerSample;
    packed[offset] = scale[sample]!;
    packed[offset + 1] = rotation[sample]!;
    packed[offset + 2] = stretchX[sample]!;
    packed[offset + 3] = stretchY[sample]!;
  }

  return packed;
}
