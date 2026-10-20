import { particleSortKey } from './particle-sort-key';

/** Logical particle order stored as fixed GPU slot IDs. */
export class ParticleOrder {
  private readonly slots: Uint32Array;
  private readonly keys: Uint32Array;
  private readonly scratch: Uint32Array;
  private readonly bins = new Uint32Array(256);
  private count = 0;

  constructor(capacity: number) {
    this.slots = new Uint32Array(capacity);
    this.keys = new Uint32Array(capacity);
    this.scratch = new Uint32Array(capacity);
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

  /** Two stable byte passes preserve the post-removal logical order for equal keys. */
  sort(): void {
    if (this.count < 2) {
      return;
    }
    this.sortByte(this.slots, this.scratch, 0);
    this.sortByte(this.scratch, this.slots, 8);
  }

  private sortByte(source: Uint32Array, target: Uint32Array, shift: number): void {
    const bins = this.bins;
    bins.fill(0);
    for (let i = 0; i < this.count; i++) {
      bins[(this.keys[source[i]!]! >>> shift) & 255]!++;
    }
    let offset = 0;
    for (let i = 0; i < 256; i++) {
      const count = bins[i]!;
      bins[i] = offset;
      offset += count;
    }
    for (let i = 0; i < this.count; i++) {
      const slot = source[i]!;
      const bucket = (this.keys[slot]! >>> shift) & 255;
      target[bins[bucket]!] = slot;
      bins[bucket]!++;
    }
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
