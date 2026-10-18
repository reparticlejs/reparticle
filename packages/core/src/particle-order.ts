import { particleSortKey } from './particle-sort-key';

/** Defold's logical particle array, containing fixed GPU slot IDs instead of particles. */
export class ParticleOrder {
  private readonly slots: Uint32Array;
  private readonly keys: Uint32Array;
  private readonly ranks: Uint32Array;
  private count = 0;

  constructor(capacity: number) {
    this.slots = new Uint32Array(capacity);
    this.keys = new Uint32Array(capacity);
    this.ranks = new Uint32Array(capacity);
  }

  add(slot: number): void {
    this.slots[this.count++] = slot;
  }

  expire(slot: number): void {
    this.keys[slot] = 65536;
  }

  /** Walk forward and recheck the swapped-in last entry, just like EraseSwap. */
  removeExpired(): void {
    let index = 0;
    while (index < this.count) {
      if (this.keys[this.slots[index]!] === 65536) {
        this.slots[index] = this.slots[--this.count]!;
      } else {
        index++;
      }
    }
  }

  setLifetime(slot: number, age: number, lifetime: number, maximum: number): void {
    this.keys[slot] = particleSortKey(age, lifetime, maximum);
  }

  sort(): void {
    for (let index = 0; index < this.count; index++) {
      this.ranks[this.slots[index]!] = index;
    }
    this.slots
      .subarray(0, this.count)
      .sort((a, b) => this.keys[a]! - this.keys[b]! || this.ranks[a]! - this.ranks[b]!);
  }

  copyTo(target: Uint32Array): number {
    if (target.length < this.count) {
      throw new RangeError('Particle order destination is too small');
    }
    target.set(this.slots.subarray(0, this.count));
    return this.count;
  }

  reset(): void {
    this.count = 0;
  }
}
