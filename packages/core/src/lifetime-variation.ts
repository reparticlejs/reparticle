import { propertyVariation } from './behaviors/property-variation';

const period = 65521;
const leaves = 65536;
let maxima: Float32Array | undefined;

/** Shared range index for the periodic lifetime random stream; allocated only when spread is used. */
function index(): Float32Array {
  if (maxima) {
    return maxima;
  }
  maxima = new Float32Array(leaves * 2).fill(-Infinity);
  for (let slot = 0; slot < period; slot++) {
    maxima[leaves + slot] = Math.fround(Math.fround(propertyVariation(slot, 0, 0) + 1) - 1);
  }
  for (let node = leaves - 1; node > 0; node--) {
    maxima[node] = Math.max(maxima[node * 2]!, maxima[node * 2 + 1]!);
  }
  return maxima;
}

function rangeMaximum(start: number, end: number): number {
  const values = index();
  let maximum = -Infinity;
  for (let left = start + leaves, right = end + leaves; left < right; left >>= 1, right >>= 1) {
    if (left % 2) {
      maximum = Math.max(maximum, values[left++]!);
    }
    if (right % 2) {
      maximum = Math.max(maximum, values[--right]!);
    }
  }
  return maximum;
}

/** Maximum random factor across consecutive physical slots, without visiting each particle. */
export function lifetimeVariation(start: number, count: number, seed: number): number {
  if (count >= period) {
    return index()[1]!;
  }
  const first = (start + seed * 127 + 2 * 8191) % period;
  const end = first + count;
  return end <= period
    ? rangeMaximum(first, end)
    : Math.max(rangeMaximum(first, period), rangeMaximum(0, end - period));
}
