# CPU allocation and draw-order profile

Measured on 2026-10-19 using the local Codex browser (Chromium 155 on macOS,
10 reported logical processors), repository revision `7ad9d57`. This is a desktop
measurement, not a Galaxy A14 result. CPU model was unavailable in the sandbox.
No production code was changed for this profile.

## Method

Bundled the actual `ParticleSlots`, `ParticleOrder`, and `ParticleOrderBuffer`
implementations with Rolldown minification. Each steady-state case uses 180 warmup
steps followed by 120 measured steps at simulated 60 Hz. Lifetime is 2 seconds,
with either zero spread or ±0.5 seconds. Births per step are rounded from the target
population divided by 120. Results below are CPU milliseconds per step.

Allocation-only cases disable order tracking; ordered cases enable the existing
Defold-compatible sort. The upload measurement includes copying into the existing
Pixi staging array and submitting `bufferSubData` to a real WebGL2 context. A
separate diagnostic copy was timed before upload, so these numbers may benefit
from warmed CPU caches. There is no draw or GPU simulation in this isolated test.
Upload submission is not GPU completion timing or a full rendering benchmark.

`readPixels` and `getBufferSubData` throw if called in the WebGL harness: zero calls
occurred and GL reported no errors. No GPU synchronization was introduced.
Browser timer resolution was approximately 0.1 ms; small per-step averages derive
from many samples and must not be interpreted as precise microsecond measurements.
A separate instrumented run brackets whole sort/removal calls to locate the cost;
it does not instrument each comparator invocation.

## Steady-state results

Lifetime spread enabled:

| Target live | Actual live range | Capacity | Allocation only, mean | Allocation + order, mean | Ordered p95 | Copy + upload submission, mean |
| ----------- | ----------------- | -------- | --------------------- | ------------------------ | ----------- | ------------------------------ |
| 6,000       | 5,939–6,014       | 8,192    | 0.010                 | 0.247                    | 0.30        | <0.01                          |
| 6,000       | 5,939–6,014       | 100,000  | 0.006                 | 0.246                    | 0.30        | Below timer resolution         |
| 30,000      | 29,735–29,926     | 100,000  | 0.028                 | 1.508                    | 1.60        | <0.01                          |
| 100,000     | 99,376–99,709     | 100,000  | 0.104                 | 5.889                    | 6.30        | 0.021                          |
| 300,000     | 298,335–298,939   | 300,000  | 0.358                 | 19.593                   | 20.90       | 0.065                          |

Without spread, ordered means were 0.25 ms at 6,000 live, 1.49 ms at 30,000,
5.54 ms at 99,960, and 18.05 ms at 300,000. Allocation-only means ranged from
below 0.01 ms through 0.023 ms. Lifetime spread adds birth sorting/compaction,
but neither is the dominant cost in these workloads.

The same 6,000 live population costs approximately the same CPU time with 8,192
and 100,000 capacity. This only describes CPU metadata: the GPU simulation still
processes its configured texture slots.

## Where the time goes

Separate instrumented steady-state run, with spread:

| Target live | Total  | `ParticleOrder.sort()` | Expired-order removal | Remaining bookkeeping |
| ----------- | ------ | ---------------------- | --------------------- | --------------------- |
| 30,000      | 1.582  | 1.473                  | 0.020                 | 0.088                 |
| 100,000     | 6.054  | 5.714                  | 0.073                 | 0.267                 |
| 300,000     | 19.723 | 18.512                 | 0.271                 | 0.939                 |

Sorting takes approximately 93–94% of the measured CPU metadata time. This method
includes rank initialization, subarray creation, and the comparator-based typed
array sort. Remaining bookkeeping includes key generation, births, expiry batches,
and instrumentation overhead.

A single long-lived cohort with no births or deaths still costs 5.68 ms at 100,000
and 19.14 ms at 300,000 each positive step. Requesting births into that full capacity
costs 5.74 / 19.11 ms respectively. Dropped birth requests are cheap; sorting the
living population remains expensive even in these cases.

## Allocation and transfer traffic

Explicit typed-array payload allocated per step, with spread:

| Target live | Birth slot arrays | Batch compaction copies | Draw-order upload |
| ----------- | ----------------- | ----------------------- | ----------------- |
| 6,000       | 200 B             | 157 B                   | ~24 KB            |
| 30,000      | 1,000 B           | 881 B                   | ~119 KB           |
| 100,000     | 3,332 B           | 2,993 B                 | ~398 KB           |
| 300,000     | 10,000 B          | 8,984 B                 | ~1.19 MB          |

Birth payload is computed from admitted births; compaction payload is counted from
actual typed-array slices. These are not whole-JS-heap allocation measurements:
engine sort scratch space, closures, array views, batch objects, GC pauses, and
object headers are not included. Without spread, these cases had no compaction
copies. At roughly 100,000 live, explicit transient payload is ~0.38 MB/s at 60 Hz;
order uploads are ~24 MB/s. At 300,000 they are ~1.14 MB/s and ~72 MB/s respectively.

From the implementation, persistent CPU typed arrays for allocation, ordering,
and Pixi staging require approximately 24.17 bytes per capacity slot, plus birth
batch storage (at least four bytes per retained slot). At 100,000 capacity that is
~2.42 MB plus batch storage. GPU simulation textures and driver buffers are excluded.
Repeated `ParticleOrderBuffer.update()` calls at unchanged revision take the cached
path; they do not copy or upload. Positive simulation steps currently change the
revision even when the final slot order is identical.

## Prewarm

Using the actual `prewarm()` function with requested offset 5 seconds and maximum
lifetime 2.5 seconds produces 151 full float32 1/60-second steps. Sorting is retained
on every step; only the final order needs upload.

| Target steady live | Live after prewarm | CPU allocation + ordering |
| ------------------ | ------------------ | ------------------------- |
| 6,000              | 5,970              | 27.5 ms                   |
| 30,000             | 29,905             | 137.2 ms                  |
| 100,000            | 99,512             | 542.2 ms                  |

These are cold-population CPU metadata costs, excluding GPU simulation. A separate
300-step stress loop (not the production lifetime-capped prewarm) took 65.9 / 362 /
1,426.2 ms respectively; submitting only its final order took approximately 0.1 ms.
The cap matters, but sorting still dominates startup at large populations.

## Recommended next change

Benchmark a stable integer radix sort for the existing 16-bit lifetime keys using
reusable scratch storage. Stability must retain the current logical order for ties,
including Defold-style swap removal before sorting. Keep fixed simulation slots,
all prewarm sorts, and the final-only prewarm upload. Compare against the current
implementation on randomized keys, quantization ties, deaths, slot reuse, and
nonpositive lifetimes before changing production behavior.

Start with sorting, not batch pooling. At 100,000 live, ~5.9 ms consumes about 35%
of a 60 Hz CPU frame budget or 71% at 120 Hz, before simulation submission and
rendering. At 300,000, the metadata step alone exceeds a 60 Hz budget on this device.
Do not extrapolate desktop results to mobile or treat them as complete-effect FPS.

Temporary harnesses for this run are retained in `/tmp/reparticle-json-runtime`:
`profile-cpu.js`, `profile-breakdown.js`, `profile-prewarm.js`, their corresponding
`build-*.mjs` bundlers and HTML pages. They add no dependencies or production hooks.

## Stable radix candidate comparison

Follow-up benchmark on the same device/browser, 2026-10-19. **The candidate is not
installed in production.** The baseline imports the actual current classes. The
candidate copies those classes and replaces only ordering's rank array/comparison
sort with a scratch array and two stable counting passes over the existing 16-bit
key (low byte, then high byte). Key generation, swap removal, admission, expiry,
and GPU slot identities are unchanged.

Each pass visits source slots in their existing order and advances each bucket's
write cursor. Equal-key entries therefore retain the input logical ordering after
both passes. This preserves the baseline's rank-based tie break, including the
logical order produced by swap removal. Expired sentinel keys are removed before
sorting, as in the baseline.

### Correctness

All **1,536 comparisons** passed with exact slot-ID order equality:

- 36 distribution cases: 0, 1, 17, 256, 6,000 and 100,000 particles; random,
  repeated, ascending, descending, equal and nonpositive-maximum keys; shuffled
  insertion order.
- 1,500 allocation steps across capacities 1, 17 and 8,192: birth masks, admitted
  counts, live counts and draw order compared after each step. Cases include
  lifetime spread, negative lifetimes, equal/quantized keys, changing maximum,
  zero-time updates, dropped births, swap removal, reused slots and resets.

This is exact equivalence to our current Defold-compatible implementation on these
cases, not a comparison against a running Defold engine or a proof of all inputs.
The candidate changes no floating-point lifetime calculation.

### Timings

Three rounds per algorithm, alternating algorithm execution order. Each round
uses 180 warmup steps then 60 measured steps (180 measured samples per algorithm).
The workload is steady births at simulated 60 Hz, lifetime 2 seconds with spread
0.5, capacity equal to target population. Numbers include **allocation plus all
ordering work**, not just the isolated sorting function. Actual populations vary
slightly below target due to randomized lifetimes and capacity limits.

| Target live | Current mean | Radix mean | Speedup | Current p95 | Radix p95 |
| ----------- | ------------ | ---------- | ------- | ----------- | --------- |
| 6,000       | 0.267 ms     | 0.043 ms   | 6.2×    | 0.40 ms     | 0.10 ms   |
| 30,000      | 1.485 ms     | 0.233 ms   | 6.4×    | 1.60 ms     | 0.30 ms   |
| 100,000     | 6.125 ms     | 0.913 ms   | 6.7×    | 6.40 ms     | 1.00 ms   |
| 300,000     | 19.581 ms    | 3.084 ms   | 6.3×    | 20.50 ms    | 3.20 ms   |

Actual capped prewarm, mean of three runs; requested offset 5 seconds, capped by
maximum lifetime 2.5 seconds, retaining all 151 simulation-step sorts:

| Target steady live | Current  | Radix   |
| ------------------ | -------- | ------- |
| 6,000              | 22.4 ms  | 4.1 ms  |
| 30,000             | 141.9 ms | 21.8 ms |
| 100,000            | 541.4 ms | 87.7 ms |

The comparison creates **no GPU context** and cannot issue GPU readbacks. GPU
simulation and order upload are excluded equally for both algorithms. Browser
clock quantization particularly affects the smallest per-step samples. These
results are from this desktop browser, not mobile or a complete-effect FPS test.

### Memory and recommendation

The candidate replaces the capacity-sized rank array with an equally sized scratch
array and adds 256 Uint32 counters: **1,024 additional persistent bytes per emitter**.
It performs no explicit per-sort allocations, unlike the current subarray view and
comparator closure; engine-internal scratch/GC savings were not measured. Particle
batch allocations remain unchanged. Count zero/one returns immediately.

The result supports adopting the candidate next, with committed regression tests
and renderer integration checks. Preserve key quantization, stable ties, swap
removal, fixed simulation slots, all prewarm sorts and final-only prewarm upload.
No production optimization was applied as part of this benchmark.

Temporary reproduction files in `/tmp/reparticle-json-runtime`:
`radix-order.ts`, `radix-slots.ts`, `profile-radix.js`, `build-profile-radix.mjs`,
`profile-radix.html`. The candidate slots class differs only in its order-class
import. The browser bundle is minified with the existing Rolldown installation;
no dependencies or production hooks were added.

## Adoption

The benchmarked two-pass stable radix sort is now used by `ParticleOrder`. The
comparison results above describe the pre-adoption baseline and candidate.
Regression tests compare stable reference ordering across large key distributions
and verify swap removal, slot reuse, reset and key quantization. The benchmark
comparison also covers lifetime spread.
Renderer checks cover blending order, living instance counts, paused uploads and
final-only prewarm upload.
