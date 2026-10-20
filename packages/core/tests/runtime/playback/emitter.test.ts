import { expect, it } from 'vitest';

import { EmitterPlayback } from '#src/runtime/playback/emitter.js';
import { SpawnSchedule } from '#src/runtime/playback/spawn-schedule.js';
import { propertyVariation } from '#src/simulation/emission/variation.js';

it('emits the complete boundary step before once stops', () => {
  const playback = new EmitterPlayback(0.25, 'once');
  const schedule = new SpawnSchedule(100);
  const counts = [0.1, 0.1, 0.1, 0.1].map((seconds) =>
    schedule.next(playback.advance(seconds) ? 100 : 0, seconds),
  );
  expect(counts).toEqual([10, 10, 10, 0]);
  expect(playback.emitting).toBe(false);
});

it('stops at an exact duration boundary without an extra floating-point frame', () => {
  const playback = new EmitterPlayback(1, 'once');
  for (let frame = 0; frame < 10; frame++) {
    expect(playback.advance(0.1)).toBe(true);
  }
  expect(playback.emitting).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
});

it('does not consume a zero-duration effect during zero-time initialization', () => {
  const playback = new EmitterPlayback(0, 'once');
  expect(playback.advance(0)).toBe(false);
  expect(playback.emitting).toBe(true);
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.emitting).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
});

it.each([0, 0.01, 0.1, 0.25])(
  'loops duration %s without clearing fractional emission',
  (duration) => {
    const playback = new EmitterPlayback(duration, 'loop');
    const schedule = new SpawnSchedule(100);
    let total = 0;
    for (let frame = 0; frame < 10; frame++) {
      const step = schedule.next(playback.advance(0.1) ? 15 : 0, 0.1);
      total += step;
    }
    expect(total).toBe(15);
    expect(playback.emitting).toBe(true);
  },
);

it('reset restarts a completed once effect', () => {
  const playback = new EmitterPlayback(0.1, 'once');
  playback.advance(0.1);
  playback.reset();
  expect(playback.emitting).toBe(true);
  expect(playback.advance(0.05)).toBe(true);
  expect(playback.emitting).toBe(true);
  expect(playback.advance(0.05)).toBe(true);
  expect(playback.emitting).toBe(false);
});

it('waits through the delay boundary and emits on the following frame', () => {
  const playback = new EmitterPlayback(0.2, 'once', 0.2);
  const schedule = new SpawnSchedule(100);
  const counts = Array.from({ length: 5 }, () => {
    const eligible = playback.emitting;
    const emitting = playback.advance(0.1);
    expect(emitting).toBe(eligible);
    return schedule.next(emitting ? 100 : 0, 0.1);
  });
  expect(counts).toEqual([0, 0, 10, 10, 0]);
});

it('carries delay overshoot into duration without emitting during the waiting frame', () => {
  const playback = new EmitterPlayback(0.15, 'once', 0.05);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.emitting).toBe(false);
});

it('applies delay only once across loops and reapplies it after reset', () => {
  const playback = new EmitterPlayback(0.1, 'loop', 0.2);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
  for (let frame = 0; frame < 5; frame++) {
    expect(playback.advance(0.1)).toBe(true);
  }
  playback.reset();
  expect(playback.emitting).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0.1)).toBe(true);
});

it('does not advance delay on zero-time updates', () => {
  const playback = new EmitterPlayback(0, 'once', 0.1);
  expect(playback.advance(0)).toBe(false);
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.advance(0)).toBe(false);
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.advance(0.1)).toBe(false);
});

it('avoids an extra waiting frame at a decimal delay boundary', () => {
  const playback = new EmitterPlayback(1, 'once', 1);
  for (let frame = 0; frame < 10; frame++) {
    expect(playback.advance(0.1)).toBe(false);
  }
  expect(playback.emitting).toBe(true);
  expect(playback.advance(0.1)).toBe(true);
});

it('samples independent timing spreads once and preserves them on reset', () => {
  const options = { seed: 42, durationSpread: 0.4, startDelaySpread: 0.3 };
  const duration = Math.max(
    0,
    0.5 + propertyVariation(0, options.seed, 9) * options.durationSpread,
  );
  const delay = 0.4 + propertyVariation(0, options.seed, 10) * options.startDelaySpread;
  const playback = new EmitterPlayback(0.5, 'once', 0.4, options);
  const reference = new EmitterPlayback(duration, 'once', delay);
  for (let replay = 0; replay < 2; replay++) {
    for (let frame = 0; frame < 30; frame++) {
      expect(playback.advance(0.05)).toBe(reference.advance(0.05));
      expect(playback.normalizedAge).toBe(reference.normalizedAge);
      expect(playback.emitting).toBe(reference.emitting);
    }
    playback.reset();
    reference.reset();
  }
});

it('keeps sampled timing across loops and uses the sampled duration for curve age', () => {
  const options = { seed: 42, durationSpread: 0.2, startDelaySpread: 0.1 };
  const duration = 0.3 + propertyVariation(0, 42, 9) * 0.2;
  const delay = 0.2 + propertyVariation(0, 42, 10) * 0.1;
  const playback = new EmitterPlayback(0.3, 'loop', 0.2, options);
  const reference = new EmitterPlayback(duration, 'loop', delay);
  for (let frame = 0; frame < 100; frame++) {
    expect(playback.advance(0.05)).toBe(reference.advance(0.05));
    expect(playback.normalizedAge).toBe(reference.normalizedAge);
  }
});

it('clamps negative sampled duration to zero but retains negative delay as clock offset', () => {
  const seed = Array.from({ length: 100 }, (_, index) => index).find(
    (value) => propertyVariation(0, value, 9) < 0 && propertyVariation(0, value, 10) < 0,
  )!;
  const once = new EmitterPlayback(0, 'once', 0, { seed, durationSpread: 1 });
  expect(once.advance(0.01)).toBe(true);
  expect(once.advance(0.01)).toBe(false);

  const delayed = new EmitterPlayback(2, 'once', 0, { seed, startDelaySpread: 1 });
  expect(delayed.emitting).toBe(true);
  expect(delayed.advance(0.01)).toBe(true);
  expect(delayed.normalizedAge).toBeCloseTo((0.01 - propertyVariation(0, seed, 10)) / 2);
});

it('reports delay, spawning, draining and sleeping in order without duplicate events', () => {
  const playback = new EmitterPlayback(0.1, 'once', 0.1);
  expect(playback.state).toBe('prespawn');
  playback.advance(0.1);
  expect(playback.takeTransitions()).toEqual([]);
  playback.advance(0.1);
  expect(playback.takeTransitions()).toEqual(['spawning', 'postspawn']);
  playback.finish(false);
  expect(playback.state).toBe('postspawn');
  playback.finish(true);
  expect(playback.takeTransitions()).toEqual(['sleeping']);
  playback.stop();
  playback.finish(true);
  expect(playback.takeTransitions()).toEqual([]);
  playback.reset();
  expect(playback.takeTransitions()).toEqual(['prespawn']);
});

it('can stop during delay without ever spawning', () => {
  const playback = new EmitterPlayback(1, 'loop', 2);
  playback.advance(0.1);
  playback.stop();
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.emitting).toBe(false);
  playback.finish(true);
  expect(playback.takeTransitions()).toEqual(['postspawn', 'sleeping']);
});

it('loop boundaries do not emit spurious state transitions', () => {
  const playback = new EmitterPlayback(0.1, 'loop');
  for (let frame = 0; frame < 20; frame++) {
    playback.advance(0.1);
  }
  playback.finish(true);
  expect(playback.state).toBe('spawning');
  expect(playback.takeTransitions()).toEqual(['spawning']);
});

it('continues emitter-time modifier curves while draining, then freezes when sleeping', () => {
  const playback = new EmitterPlayback(1, 'loop');
  playback.advance(0.1);
  playback.stop();
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.normalizedAge).toBeCloseTo(0.2);
  playback.finish(true);
  playback.advance(0.1);
  expect(playback.normalizedAge).toBeCloseTo(0.2);
});

it('retires at the current boundary, preserving the final frame and curve endpoint', () => {
  const playback = new EmitterPlayback(0.3, 'loop');
  playback.advance(0.1);
  playback.takeTransitions();
  playback.retire();
  playback.retire();
  expect(playback.takeTransitions()).toEqual([]);
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.state).toBe('spawning');
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.normalizedAge).toBe(1);
  expect(playback.takeTransitions()).toEqual(['postspawn']);
  expect(playback.advance(0.1)).toBe(false);
  playback.finish(false);
  expect(playback.state).toBe('postspawn');
  playback.finish(true);
  expect(playback.takeTransitions()).toEqual(['sleeping']);
});

it('retirement during delay waits, then emits one full cycle', () => {
  const playback = new EmitterPlayback(0.2, 'loop', 0.2);
  playback.retire();
  expect([0.1, 0.1, 0.1, 0.1, 0.1].map((dt) => playback.advance(dt))).toEqual([
    false,
    false,
    true,
    true,
    false,
  ]);
  expect(playback.takeTransitions()).toEqual(['spawning', 'postspawn']);
});

it('retirement after a wrapped boundary finishes the newly started cycle', () => {
  const playback = new EmitterPlayback(0.2, 'loop');
  playback.advance(0.1);
  playback.advance(0.1);
  expect(playback.normalizedAge).toBe(0);
  playback.retire();
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.state).toBe('spawning');
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.state).toBe('postspawn');
});

it.each(['once', 'loop'] as const)('retiring zero duration %s emits one positive step', (mode) => {
  const playback = new EmitterPlayback(0, mode);
  playback.retire();
  expect(playback.advance(0)).toBe(false);
  expect(playback.state).toBe('prespawn');
  expect(playback.advance(0.1)).toBe(true);
  expect(playback.advance(0.1)).toBe(false);
});

it('reset cancels retirement and stop overrides it immediately', () => {
  const playback = new EmitterPlayback(0.2, 'loop');
  playback.retire();
  playback.reset();
  for (let frame = 0; frame < 6; frame++) {
    expect(playback.advance(0.1)).toBe(true);
  }
  playback.retire();
  playback.stop();
  expect(playback.advance(0.1)).toBe(false);
  playback.finish(true);
  playback.takeTransitions();
  playback.retire();
  expect(playback.advance(0.1)).toBe(false);
  expect(playback.takeTransitions()).toEqual([]);
});

it('retirement respects sampled duration and does not change once playback', () => {
  const options = { seed: 42, durationSpread: 0.4, startDelaySpread: 0.1 };
  const retiring = new EmitterPlayback(0.3, 'loop', 0.2, options);
  const once = new EmitterPlayback(0.3, 'once', 0.2, options);
  retiring.retire();
  once.retire();
  for (let frame = 0; frame < 30; frame++) {
    expect(retiring.advance(0.05)).toBe(once.advance(0.05));
    expect(retiring.normalizedAge).toBe(once.normalizedAge);
    expect(retiring.state).toBe(once.state);
  }
});
