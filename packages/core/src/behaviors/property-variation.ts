/** Independent spawn-property stream; integer steps stay exact in float32. */
export function propertyVariation(particleId: number, seed: number, stream: number): number {
  let value = ((particleId % 65521) + seed * 127 + stream * 8191) % 65521;
  value = (value * 251 + 17) % 65521;
  value = (value * 241 + 31) % 65521;
  value = (value * ((value % 127) + 1) + 97) % 65521;
  return value / 32760 - 1;
}
