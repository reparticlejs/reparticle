import { tgpu, d } from 'typegpu';

/**
 * Return tangential acceleration [x, y] in simulation units per second squared.
 *
 * With canvas Y pointing down, positive sampled magnitude accelerates
 * counterclockwise around the center; negative magnitude reverses circulation.
 * Strength stays constant with distance, including exactly maxDistance.
 * Outside that radius, acceleration is zero.
 *
 * At the exact center there is no tangent, so use the modifier's supplied unit
 * fallback direction (its transformed local -X axis). A zero maxDistance
 * affects only that center. The caller multiplies acceleration by elapsed
 * seconds and adds it to velocity.
 */
export const applyVortex = tgpu
  .fn(
    [d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32, d.f32],
    d.vec2f,
  )(
    (
      x,
      y,
      centerX,
      centerY,
      fallbackDirectionX,
      fallbackDirectionY,
      magnitude,
      spread,
      spreadFactor,
      maxDistance,
    ) => {
      'use gpu';
      const offsetX = x - centerX;
      const offsetY = y - centerY;
      const distanceSquared = offsetX * offsetX + offsetY * offsetY;
      const maxDistanceSquared = maxDistance * maxDistance;
      // Check the cutoff before normalizing, avoiding a square root outside the radius.
      if (distanceSquared > maxDistanceSquared) {
        return d.vec2f(0, 0);
      }
      const sampledMagnitude = magnitude + spread * spreadFactor;
      if (distanceSquared === 0) {
        return d.vec2f(
          fallbackDirectionX * sampledMagnitude,
          fallbackDirectionY * sampledMagnitude,
        );
      }
      // Rotate the outward direction 90° counterclockwise in canvas coordinates.
      const distance = Math.sqrt(distanceSquared);
      const tangentX = offsetY / distance;
      const tangentY = -offsetX / distance;
      return d.vec2f(tangentX * sampledMagnitude, tangentY * sampledMagnitude);
    },
  )
  .$name('applyVortex');
