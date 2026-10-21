# GPU capacity profile: 6,000 live particles

Measured on 2026-10-19 in the local Codex browser (Chromium 155 on macOS).
Production code and fixed-slot architecture are unchanged.

## Method

Actual built GPU.js core and Pixi renderer, bundled with Rolldown minification.
A 512 × 512 WebGL2 canvas at resolution 1 draws white 4-unit particles with alpha
0.5. Circle emitter diameter 200, speed 20, lifetime 2 seconds, rate 3,000/second,
seed 1, no modifiers. Continuous births/deaths at simulated 1/60-second updates.
Every measured frame has exactly **6,000 live particles and 6,000 drawn instances**,
verified using existing CPU lifetime/order metadata and the instanced draw count.

Each case warms up with 150 update/render pairs, then measures 90 pairs. Three
rounds rotate capacity order: 8,192 / 32,768 / 100,000; 100,000 / 8,192 / 32,768;
32,768 / 100,000 / 8,192. There are 270 measured frames per capacity.

Separate `EXT_disjoint_timer_query_webgl2` queries bracket `view.update()` and
`app.render()`. Query availability is polled asynchronously between tasks; results
are GPU elapsed times, not CPU call duration. No `finish()` or synchronous GPU
completion wait is used. `flush()` submits work before yielding with `setTimeout`;
this is not a vsync/FPS benchmark. Timing queries cover the GPU work inside their
respective stages, including associated uploads/state work, rather than isolating
one kernel or shader instruction sequence.

CPU timings separately bracket the same two calls. CPU update includes allocation,
radix ordering, and GPU.js submission. CPU rendering includes draw-order upload and
Pixi submission. The CPU live-count check is outside both timed sections.

No particle data, buffers, or framebuffer pixels are read back. `readPixels` and
`getBufferSubData` are trapped after Pixi initialization, including ParticleEffect
creation and all benchmark steps. **Zero calls, zero GL errors, no disjoint or
missing queries.** Reading timer-query results retrieves timing metadata only.

## Results

Mean across all 270 measured frames (equal-sized rounds). The typical column is
the median of the three round medians, not a pooled sample median.

| Capacity | GPU simulation mean | Typical GPU simulation | GPU rendering mean | Typical GPU rendering |
| -------- | ------------------- | ---------------------- | ------------------ | --------------------- |
| 8,192    | 0.158 ms            | 0.090 ms               | 0.252 ms           | 0.227 ms              |
| 32,768   | 0.259 ms            | 0.191 ms               | 0.258 ms           | 0.227 ms              |
| 100,000  | 0.550 ms            | 0.508 ms               | 0.212 ms           | 0.211 ms              |

Per-round GPU means, to expose repeatability:

| Capacity | Simulation round 1 / 2 / 3 | Rendering round 1 / 2 / 3 |
| -------- | -------------------------- | ------------------------- |
| 8,192    | 0.170 / 0.131 / 0.172 ms   | 0.258 / 0.262 / 0.236 ms  |
| 32,768   | 0.255 / 0.259 / 0.263 ms   | 0.270 / 0.246 / 0.257 ms  |
| 100,000  | 0.543 / 0.530 / 0.576 ms   | 0.220 / 0.199 / 0.218 ms  |

Simulation per-round p95 ranges: 0.530–0.646 ms at 8,192; 0.546–0.738 ms at
32,768; 0.857–0.996 ms at 100,000. Rendering p95 ranges respectively:
0.319–0.526 / 0.249–0.563 / 0.243–0.518 ms. Outliers raise the means above
medians, but all rounds retain the simulation capacity trend.

CPU submission means:

| Capacity | CPU update | CPU render |
| -------- | ---------- | ---------- |
| 8,192    | 0.154 ms   | 0.070 ms   |
| 32,768   | 0.306 ms   | 0.205 ms   |
| 100,000  | 0.218 ms   | 0.134 ms   |

CPU timings are non-monotonic and subject to scheduling, driver and approximately
0.1 ms timer granularity. They must not be substituted for GPU timings. CPU and GPU
work overlap; adding these means is not a reliable frame-time prediction.

## Interpretation

Unused capacity has a measurable simulation cost: 100,000 versus 8,192 adds
approximately **0.392 ms mean GPU time per update**, or **0.418 ms** using the
round-median comparison. Mean simulation time is about 3.5× higher; typical time
about 5.6× higher. Rendering does not grow with capacity in this workload because
both configurations draw the same live count. The slightly lower rendering time
at 100,000 is not evidence that increasing capacity improves rendering.

The texture layout rounds capacity to 256-wide rows: 32, 128 and 391 rows per
state band (five bands), respectively. Thus the 100,000 case physically processes
100,096 slot positions. This is the current architecture; no compaction, active
region clipping, changed ordering or capacity resizing was introduced.

These desktop results establish wasted GPU work, but do not establish that packed
storage would be a net win. A packed prototype would need to save more GPU time
than it adds in CPU mapping, uploads, shader indirection and state management.
Reducing configured capacity is already a useful baseline for this population.
The absolute saving here is under half a millisecond per update; multiple emitters,
heavier modifier configurations and mobile devices may change its importance.
No Galaxy A14 measurement or architectural recommendation can be inferred from
this single desktop workload alone.

Temporary reproduction files in `/tmp/reparticle-json-runtime`:
`profile-capacity.js`, `build-profile-capacity.mjs`, `profile-capacity.html` and
`profile-capacity-rolldown.js`. Only the Rolldown build was timed. No dependencies
or production instrumentation were added.
