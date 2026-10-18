import { describe, expect, it } from 'vitest';

import { ParticleOrder } from '#src/particle-order.js';
import { ParticleSlots } from '#src/particle-slots.js';
import { particleSortKey } from '#src/particle-sort-key.js';

function read(order: ParticleOrder) {
  const target = new Uint32Array(10);
  return Array.from(target.subarray(0, order.copyTo(target)));
}

describe('Defold logical order', () => {
  it('uses the post-swap index for ties and rechecks swapped dead entries', () => {
    const order = new ParticleOrder(5);
    for (let slot = 0; slot < 5; slot++) {
      order.add(slot);
      order.setLifetime(slot, 0, 1, 1);
    }
    order.sort();
    order.expire(1);
    order.expire(4);
    order.removeExpired();
    order.add(1);
    order.setLifetime(1, 0, 1, 1);
    order.sort();
    expect(read(order)).toEqual([0, 3, 2, 1]);
  });

  it('sorts every step even without a renderer and appends births in allocation order', () => {
    const slots = new ParticleSlots(3, true);
    slots.advance(0, 1, 1, 0, 1, 1);
    slots.advance(0, 1, 3, 0, 2, 1);
    slots.advance(0, 1, 2, 0, 3, 1);
    // All three keys clamp to zero; the first particle dies, swapping in slot 2.
    slots.advance(1.5, 0, 1, 0, 4, 0);
    const target = new Uint32Array(3);
    expect(slots.copyOrder(target)).toBe(2);
    expect(Array.from(target.subarray(0, 2))).toEqual([2, 1]);
    slots.advance(0, 1, 2, 0, 5, 0);
    slots.copyOrder(target);
    expect(Array.from(target)).toEqual([2, 1, 0]);
    slots.reset();
    expect(slots.copyOrder(target)).toBe(0);
  });

  it('matches an independent swap-removal reference over many steps without drawing', () => {
    const slots = new ParticleSlots(37, true);
    let reference: { slot: number; age: number; lifetime: number; generation: number }[] = [];
    const target = new Uint32Array(37);
    for (let frame = 0; frame < 180; frame++) {
      const before = new Map(reference.map((p) => [p.slot, p.generation]));
      const dt = 0.0625;
      let index = 0;
      while (index < reference.length) {
        const particle = reference[index]!;
        particle.age = Math.fround(particle.age + dt);
        if (particle.age > particle.lifetime) {
          reference[index] = reference[reference.length - 1]!;
          reference.pop();
        } else {
          index++;
        }
      }
      const maximum = frame % 7 === 0 ? 0.1 : 1;
      slots.advance(dt, frame % 6, 0.25, 0, frame, maximum);
      slots.forEachLifetime((slot, age, lifetime, generation) => {
        if (before.get(slot) !== generation) {
          reference.push({ slot, age, lifetime, generation });
        }
      });
      reference.sort(
        (a, b) =>
          particleSortKey(a.age, a.lifetime, maximum) - particleSortKey(b.age, b.lifetime, maximum),
      );
      const count = slots.copyOrder(target);
      expect(Array.from(target.subarray(0, count))).toEqual(reference.map((p) => p.slot));
    }
  });

  it('quantizes and clamps the remaining-lifetime key', () => {
    expect(particleSortKey(0, 10, 10)).toBe(0);
    expect(particleSortKey(5, 10, 10)).toBe(32767);
    expect(particleSortKey(10, 10, 10)).toBe(65535);
    expect(particleSortKey(0, 20, 10)).toBe(0);
    expect(particleSortKey(1, 0, 10)).toBe(65535);
    expect(particleSortKey(0, 0, 0)).toBe(65535);
  });
});
