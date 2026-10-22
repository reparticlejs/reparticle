/** Each particle uses one texel in each of five vertically stacked state bands. */
const PARTICLE_BANDS = 5;

/**
 * Choose the smallest particle-state texture for a validated emitter capacity.
 *
 * `width` is the number of slots across a band. `rows` is the height of ONE band,
 * so the actual texture height is `rows * PARTICLE_BANDS`. For example, capacity
 * 16 uses width 8 and rows 2: an 8 × 10 texture with no unused slots.
 *
 * Minimize allocated slots first. When allocations tie, prefer the full texture
 * closest to square. This is a storage policy, not a claim about GPU performance.
 *
 * Before a renderer is attached, omit maxTextureSize to find an unconstrained
 * layout. Initialization repeats the search using the device's MAX_TEXTURE_SIZE.
 * The search runs only during setup; it does not allocate or read GPU resources.
 */
export function textureLayout(capacity: number, maxTextureSize = capacity * PARTICLE_BANDS) {
  // Enough rows to keep width within the limit; few enough to fit all five bands.
  const minimumRows = Math.ceil(capacity / maxTextureSize);
  const maximumRows = Math.min(capacity, Math.floor(maxTextureSize / PARTICLE_BANDS));
  if (minimumRows > maximumRows) {
    throw new RangeError('Capacity exceeds GPU texture limits');
  }

  // Start with a valid layout, then compare the remaining row counts against it.
  let bestRows = minimumRows;
  let bestWidth = Math.ceil(capacity / bestRows);
  let fewestSlots = bestWidth * bestRows;
  let smallestSideDifference = Math.abs(bestWidth - bestRows * PARTICLE_BANDS);

  for (let rows = minimumRows + 1; rows <= maximumRows; rows++) {
    // Wider layouts at this row count only waste space, so consider just this width.
    const width = Math.ceil(capacity / rows);
    const allocatedSlots = width * rows;
    if (allocatedSlots > fewestSlots) {
      continue;
    }

    const textureHeight = rows * PARTICLE_BANDS;
    const sideDifference = Math.abs(width - textureHeight);
    const sameStorage = allocatedSlots === fewestSlots;
    if (sameStorage && sideDifference >= smallestSideDifference) {
      continue;
    }

    bestWidth = width;
    bestRows = rows;
    fewestSlots = allocatedSlots;
    smallestSideDifference = sideDifference;
  }

  return { width: bestWidth, rows: bestRows };
}
