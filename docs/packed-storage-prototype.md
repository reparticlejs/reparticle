# Packed GPU storage prototype

Prototype and benchmark on 2026-10-19, local Chromium 155/macOS. **No production
source, dependency, or architecture changes.** The prototype lives separately in
`/tmp/reparticle-packed`; benchmark and validation pages live in
`/tmp/reparticle-json-runtime`.

## What was prototyped

The existing CPU allocator, lifetime metadata, radix sort, quantized keys and
Defold tie-breaking remain unchanged. Logical slot IDs still determine random
variation and capacity admission. Physical GPU storage is separate:

1. Obtain the allocator's final sorted logical IDs every update.
2. Build a map containing each ID and its previous physical location.
3. Upload that map to GPU.js; retain logical IDs for all birth randomness.
4. Run the same behavior math, reading survivors from their mapped previous
   locations and writing consecutive physical positions in draw order.
5. Render physical indices 0 through live-count minus one, preserving logical
   draw order. No sorting is skipped during prewarm.

GPU.js uses dynamic output/argument dimensions. Each state band has
`max(1, ceil(liveCount / 256))` rows. Previous and next row strides are supplied
separately so growing/shrinking outputs read the right previous bands. Padding is
zeroed. The five-band particle layout and behavior functions remain intact.
Kernel functions are compiled to strings by the existing package build process
inside the isolated copy; there is no runtime source-rewriting requirement.

At 6,000 live particles, packed output has 24 rows per band (6,144 physical slot
positions), regardless of configured capacity. Fixed output uses 32 / 128 / 391
rows at capacities 8,192 / 32,768 / 100,000. The prototype still retains logical
capacity-sized allocator metadata and spawn masks. It is not a GPU-only allocator.

## Behavior validation without particle readback

A GPU comparison shader checks all four channels in all five state bands for each
living logical ID, matching its fixed-slot texels to the corresponding packed
position. Equal fragments are discarded; an occlusion query reports only whether
any mismatch exists. Tolerance is `1e-5 + abs(reference) * 1e-5` per channel.
Positive-control queries deliberately emit fragments to verify the check works.
No particle values, framebuffer pixels, or buffer contents are read back.

**888 extended checks passed**, with zero trapped `readPixels` / `getBufferSubData`
calls and zero GL errors. Coverage includes:

- Point, circle, box and 2D cone; world/local space.
- Default, movement-direction and angular-velocity orientation.
- Acceleration, drag, radial and vortex applied together.
- Initial speed, lifetime, size, rotation, color/alpha and stretch spread.
- Emitter rotation/scale; births, expiry, dropped births, reused logical IDs,
  changing physical texture height, zero-time updates, draining and reset.
- Start-offset prewarm, with comparisons after prewarm and subsequent updates.

An earlier 111-check run without prewarm also passed, covering empty initial state
and growth. Query results are timing/pass-fail metadata only. An initial apparent
mismatch was a harness bug comparing numeric query result `0` with boolean `false`;
normalizing that result fixed it. The numerical behavior comparison is against our
current implementation, not a running Defold engine. This is broad prototype
validation, not complete renderer/lifecycle/API conformance certification.

## Benchmark method

Same workload as the capacity profile: exactly **6,000 live and drawn particles**,
3,000 births/second, lifetime 2 seconds, circle diameter 200, speed 20, 4-unit white
textured particles, alpha 0.5, no modifiers, 512 × 512 canvas, resolution 1.
Continuous allocation/death churn; step 1/60 second.

Three rounds rotate capacities and alternate fixed/packed execution order. Each
case has 150 warmup update/render pairs and 90 measured pairs: 270 measured frames
per capacity per implementation. Both use minified bundles. Fixed uses the existing
built packages; packed uses the isolated source copy and the same Pixi version.

Separate asynchronous GPU timer queries bracket update and render. CPU timings
include actual update/render calls: packed CPU update includes mapping construction,
array views, GPU.js input upload submission, and dynamic-output setup. No manual
`finish()` or GPU-state readback is used. All samples retained: no disjoint queries,
no timeouts, zero readbacks and zero GL errors. Correctness validation ran separately
from timed runs, not concurrently.

## Results

Mean milliseconds per stage across three equal-sized rounds:

| Capacity | Storage | CPU update | CPU render | GPU update | GPU render |
| -------- | ------- | ---------- | ---------- | ---------- | ---------- |
| 8,192    | Fixed   | 0.249      | 0.151      | 0.177      | 0.208      |
| 8,192    | Packed  | 0.347      | 0.166      | 0.300      | 0.165      |
| 32,768   | Fixed   | 0.258      | 0.157      | 0.281      | 0.206      |
| 32,768   | Packed  | 0.332      | 0.140      | 0.297      | 0.200      |
| 100,000  | Fixed   | 0.317      | 0.200      | 0.559      | 0.183      |
| 100,000  | Packed  | 0.431      | 0.199      | 0.270      | 0.203      |

Per-round GPU update means:

| Capacity | Fixed                    | Packed                   |
| -------- | ------------------------ | ------------------------ |
| 8,192    | 0.155 / 0.207 / 0.167 ms | 0.347 / 0.274 / 0.279 ms |
| 32,768   | 0.292 / 0.272 / 0.279 ms | 0.272 / 0.287 / 0.331 ms |
| 100,000  | 0.551 / 0.565 / 0.561 ms | 0.267 / 0.289 / 0.253 ms |

At 100,000 capacity, packing saves **0.289 ms GPU update time (~52%)**, with
**0.114 ms additional CPU update time (~36%)**. GPU update plus render decreases
from approximately 0.742 to 0.473 ms; CPU update plus render increases from 0.518
to 0.631 ms. CPU and GPU overlap, so subtracting those differences is not a proven
end-to-end frame-time improvement.

At 8,192, both CPU and GPU update regress. At 32,768, the GPU change is small and
not consistently positive across rounds, while CPU mapping overhead remains.
This prototype's indirection and dynamic GPU.js path have a real cost even when
fewer physical slots are processed. Fewer slots do not automatically mean a faster
system.

## Added costs and unresolved production work

- Packed map payload: two floats per live particle, **48 KB/update at 6,000**, or
  2.88 MB/s at 60 updates/second, in addition to existing spawn and draw-order data.
  This is logical payload; GPU.js/driver padding and actual bus traffic were not
  measured.
- Three additional CPU arrays consume **16 bytes per configured slot** (IDs,
  previous positions, two-float map): approximately 1.6 MB at 100,000 capacity.
- Construction still initializes capacity-sized state. Dynamic GPU.js outputs may
  retain or reallocate backing storage as dimensions change; this benchmark does
  not establish peak-memory savings or bound resize-related stalls.
- Richer effects, multiple emitters, filters/masks, device loss, frequent large
  population changes, full prewarm latency and mobile performance need separate
  qualification before considering production adoption.

## Decision

**Keep fixed slots in production for now.** Packing demonstrates a useful GPU
saving for very sparse capacity, but loses against a tightly sized fixed buffer on
this device and adds CPU/memory cost. For this 6,000-live workload, configuring
8,192 fixed slots remains a better baseline than packing a 100,000-slot allocation.

If high spare capacity is a real product requirement, the next decision needs a
representative mobile/full-effect test and a production-quality mapping strategy.
These results justify further targeted investigation, not a universal architectural
replacement.

## Prototype files

- `/tmp/reparticle-packed/core/src/index.ts`: packed emitter adapter.
- `/tmp/reparticle-packed/core/src/gpujs/integrate.ts`: mapped reads, dense writes.
- `/tmp/reparticle-packed/core/src/simulation/functions.json`: compiled candidate kernels.
- `/tmp/reparticle-packed/packed.js`: isolated renderer/core bundle.
- `/tmp/reparticle-json-runtime/profile-packed.js` and `build-profile-packed.mjs`:
  benchmark and bundler; `profile-packed.html`: runner.
- `/tmp/reparticle-json-runtime/validate-packed.js`, `build-validate-packed.mjs`,
  `validate-packed.html`: GPU-side equivalence checks.

All implementation files remain outside the production repository. These are
local temporary prototypes, not a supported alternate API or consumer build setup.
