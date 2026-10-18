import { expect, it } from 'vitest';

import { propertyVariation } from '#src/behaviors/property-variation.js';
import { lifetimeVariation } from '#src/lifetime-variation.js';
import { ParticleLifetimes } from '#src/particle-lifetimes.js';

const f = Math.fround;
function sampledLifetime(slot: number, seed: number, lifetime: number, spread: number): number {
  const variation = f(f(propertyVariation(slot, seed, 2) + 1) - 1);
  return f(f(lifetime) + f(f(spread) * variation));
}

it.each([
  [0, 1, 0],
  [65490, 70, 65535],
  [70000, 1000, 42],
  [0, 65521, 123],
])('finds the exact range maximum for start %s, count %s, seed %s', (start, count, seed) => {
  let maximum = -Infinity;
  for (let slot = start; slot < start + count; slot++) {
    maximum = Math.max(maximum, f(f(propertyVariation(slot, seed, 2) + 1) - 1));
  }
  expect(lifetimeVariation(start, count, seed)).toBe(maximum);
});

it.each([1, 7, 100, 65530])(
  'matches slot lifetimes through ring reuse at capacity %s',
  (capacity) => {
    const lifetimes = new ParticleLifetimes(capacity);
    const slots = new Map<number, { age: number; lifetime: number }>();
    let cursor = 0;
    for (let frame = 0; frame < 180; frame++) {
      const seconds = [0, 0.016, 0.05, 0.1][frame % 4]!;
      const count = frame < 60 && seconds > 0 ? Math.min(capacity, (frame * 23) % 117) : 0;
      const lifetime = frame % 11 === 0 ? -0.2 : (frame % 9) / 10;
      const spread = frame % 5 === 0 ? 0 : 0.4;
      const seed = frame * 17;
      for (const particle of slots.values()) {
        particle.age = f(particle.age + f(seconds));
      }
      for (let index = 0; index < count; index++) {
        const slot = (cursor + index) % capacity;
        slots.set(slot, { age: 0, lifetime: sampledLifetime(slot, seed, lifetime, spread) });
      }
      cursor = (cursor + count) % capacity;
      lifetimes.advance(seconds, count, lifetime, spread, seed);
      const alive = [...slots.values()].some((particle) => particle.age < particle.lifetime);
      expect(lifetimes.empty, `frame ${frame}`).toBe(!alive);
    }
  },
);

it('keeps old lifetimes when new births change settings and clears bookkeeping on reset', () => {
  const lifetimes = new ParticleLifetimes(100);
  lifetimes.advance(0.1, 10, 0.5, 0, 0);
  lifetimes.advance(0.1, 10, 0, 0, 1);
  expect(lifetimes.empty).toBe(false);
  lifetimes.reset();
  expect(lifetimes.empty).toBe(true);
  lifetimes.advance(0.1, 1, 0.1, 0, 0);
  expect(lifetimes.empty).toBe(false);
  lifetimes.advance(0.1, 0, 0, 0, 0);
  expect(lifetimes.empty).toBe(true);
});
