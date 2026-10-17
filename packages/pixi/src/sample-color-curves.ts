import { CURVE_SEGMENTS, sampleCurve, type EmitterConfig } from '@reparticle/core';

/** Pack RGBA together so all curves fit within WebGL2's minimum vertex uniform budget. */
export function sampleColorCurves(properties: EmitterConfig['overLifetime']): Float32Array {
  const channels = [properties.red, properties.green, properties.blue, properties.alpha];
  const result = new Float32Array((CURVE_SEGMENTS + 1) * 4);
  for (const [channel, property] of channels.entries()) {
    const samples = sampleCurve(property);
    for (let index = 0; index < samples.length; index++) {
      result[index * 4 + channel] = samples[index]!;
    }
  }
  return result;
}
