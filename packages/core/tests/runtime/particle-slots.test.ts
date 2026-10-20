import { expect, it } from 'vitest';

import { EmitterPlayback } from '#src/runtime/emitter-playback.js';
import { ParticleSlots } from '#src/runtime/particle-slots.js';
import { SpawnSchedule } from '#src/runtime/spawn-schedule.js';
import { propertyVariation } from '#src/simulation/emission/variation.js';

function selected(mask: Float32Array, capacity: number): number[] {
  return Array.from({ length: capacity }, (_, slot) => slot).filter(
    (slot) => (mask[Math.floor(slot / 24)]! & (1 << (slot % 24))) !== 0,
  );
}

it('fills capacity, preserves living particles, and drops excess without a backlog', () => {
  const slots = new ParticleSlots(3);
  const schedule = new SpawnSchedule(3);
  expect(slots.advance(0.1, schedule.next(100, 0.1), 0.5, 0, 1)).toBe(3);
  expect(selected(slots.spawnMask, 3)).toEqual([0, 1, 2]);
  expect(slots.advance(0.1, schedule.next(100, 0.1), 10, 0, 2)).toBe(0);
  expect(selected(slots.spawnMask, 3)).toEqual([]);
  expect(slots.count).toBe(3);
  slots.advance(0.5, schedule.next(0, 0.1), 10, 0, 2);
  expect(slots.empty).toBe(true);
  expect(slots.advance(0.1, schedule.next(10, 0.1), 10, 0, 2)).toBe(1);
});

it('reuses scattered expired slots and never replaces a longer-lived neighbor', () => {
  const slots = new ParticleSlots(6);
  slots.advance(0.01, 2, 1, 0, 1);
  slots.advance(0.01, 2, 0.02, 0, 2);
  slots.advance(0.01, 2, 1, 0, 3);
  expect(slots.advance(0.01, 5, 1, 0, 4)).toBe(2);
  expect(selected(slots.spawnMask, 6)).toEqual([2, 3]);
  expect(slots.count).toBe(6);
});

it.each([1, 7, 24, 25, 100, 8192])('matches float32 slot lifetimes at capacity %s', (capacity) => {
  const slots = new ParticleSlots(capacity);
  const reference = new Map<number, { age: number; lifetime: number }>();
  const f = Math.fround;
  for (let frame = 0; frame < 300; frame++) {
    const seconds = [0, 0.016, 0.05, 0.1][frame % 4]!;
    const requested = frame % 11 === 0 ? capacity * 2 : frame % 23;
    const lifetime = frame % 7 === 0 ? -0.1 : (frame % 9) / 10;
    const spread = frame % 3 === 0 ? 0 : 0.4;
    const seed = frame * 17;
    for (const [slot, particle] of reference) {
      particle.age = f(particle.age + f(seconds));
      if (seconds > 0 && particle.age > particle.lifetime) {
        reference.delete(slot);
      }
    }
    const available = capacity - reference.size;
    const admitted = slots.advance(seconds, requested, lifetime, spread, seed);
    const births = selected(slots.spawnMask, capacity);
    expect(admitted).toBe(Math.min(requested, available));
    expect(births).toHaveLength(admitted);
    for (const slot of births) {
      expect(reference.has(slot)).toBe(false);
      const variation = f(f(propertyVariation(slot, seed, 2) + 1) - 1);
      reference.set(slot, { age: f(seconds), lifetime: f(f(lifetime) + f(f(spread) * variation)) });
    }
    expect(slots.count).toBe(reference.size);
    expect(slots.empty).toBe(reference.size === 0);
    if (frame % 79 === 0) {
      slots.reset();
      reference.clear();
    }
  }
});

it('encodes all 24 bits exactly and clears stale spawn bits', () => {
  const slots = new ParticleSlots(49);
  slots.advance(0.1, 49, 1, 0, 1);
  expect([...slots.spawnMask]).toEqual([16777215, 16777215, 1]);
  slots.advance(0.1, 49, 1, 0, 1);
  expect([...slots.spawnMask]).toEqual([0, 0, 0]);
  slots.reset();
  expect(slots.count).toBe(0);
  slots.advance(0.1, 1, 1, 0, 1);
  expect(selected(slots.spawnMask, 49)).toEqual([0]);
});
it.each([0.01, 0, -0.1])('keeps lifetime %s newborns in postspawn until cleanup', (lifetime) => {
  const playback = new EmitterPlayback(0.1, 'once');
  const particles = new ParticleSlots(8);
  playback.advance(0.1);
  particles.advance(0.1, 1, lifetime, 0, 1);
  playback.finish(particles.empty);
  expect(playback.takeTransitions()).toEqual(['spawning', 'postspawn']);
  particles.advance(0, 0, lifetime, 0, 1);
  expect(particles.empty).toBe(false);
  particles.advance(0.01, 0, lifetime, 0, 1);
  playback.finish(particles.empty);
  expect(playback.takeTransitions()).toEqual(['sleeping']);
});

it('retains the exact endpoint and announces sleeping only after it', () => {
  const playback = new EmitterPlayback(0.25, 'once');
  const particles = new ParticleSlots(8);
  playback.advance(0.25);
  particles.advance(0.25, 1, 0.5, 0, 1);
  playback.finish(particles.empty);
  playback.takeTransitions();
  particles.advance(0.25, 0, 0.5, 0, 1);
  playback.finish(particles.empty);
  expect(playback.takeTransitions()).toEqual([]);
  expect(playback.state).toBe('postspawn');
  particles.advance(0.25, 0, 0.5, 0, 1);
  playback.finish(particles.empty);
  expect(playback.takeTransitions()).toEqual(['sleeping']);
});

it('exposes live lifetime metadata with a new generation for reused and reset slots', () => {
  const slots = new ParticleSlots(1);
  const visits: number[][] = [];
  const visit = (slot: number, age: number, lifetime: number, generation: number) => {
    visits.push([slot, age, lifetime, generation]);
  };
  slots.advance(0.125, 1, 0.125, 0, 1);
  slots.forEachLifetime(visit);
  expect(visits[0]?.slice(0, 3)).toEqual([0, 0.125, 0.125]);
  slots.advance(0.125, 1, 1, 0, 2);
  slots.forEachLifetime(visit);
  expect(visits[1]?.slice(0, 3)).toEqual([0, 0.125, 1]);
  expect(visits[1]![3]).toBeGreaterThan(visits[0]![3]!);
  slots.reset();
  slots.forEachLifetime(visit);
  expect(visits).toHaveLength(2);
  slots.advance(0, 1, 2, 0, 1);
  slots.forEachLifetime(visit);
  expect(visits[2]![3]).toBeGreaterThan(visits[1]![3]!);
});
