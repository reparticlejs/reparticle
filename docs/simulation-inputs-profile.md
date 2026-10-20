# Grouped simulation inputs

Measured on 2026-10-20 in the local Codex browser using the actual built core,
GPU.js, WebGL2, and Rolldown minification. The baseline is the implementation
immediately before grouping the kernel arguments.

## Storage and uploads

The emitter owns mutable named parameter groups. Each update kernel owns its
argument array and twelve pairs of four-number buffers, allocated once.
GPU.js receives explicit `Array(4)` argument types, which generate `vec4`
uniforms and use `uniform4fv`. Leaving these types inferred would create
array textures instead.

GPU.js caches uploaded vector arrays by reference. A buffer must therefore
remain unchanged until a different buffer replaces it in the cache. Each group
uses two buffers: unchanged values retain the current buffer; changed values
write into the spare and swap. Each alternating update kernel has its own pairs.
Blindly swapping on every frame would be incorrect after skipped uploads.

The packing/update path creates no per-step objects or arrays. This is a claim
about Reparticle's parameter handling, not a guarantee about allocations inside
GPU.js or the browser. Existing particle textures, spawn masks, curves, and
modifier buffers keep their upload paths.

Observed over 60 steady simulation steps at 8,192 capacity:

| Operation                         |  Before |   After |
| --------------------------------- | ------: | ------: |
| Texture uploads (`texImage2D`)    |     240 |     240 |
| Texture data bytes                | 402,240 | 402,240 |
| Scalar float uniform uploads      |      60 |       0 |
| Four-component uniform uploads    |       0 |      60 |
| Texture creation                  |       0 |       0 |
| `readPixels` / `getBufferSubData` |   0 / 0 |   0 / 0 |

In this steady case only the seed changes. One vec4 upload replaces one scalar
upload, increasing uniform payload by twelve bytes per step; texture traffic
does not increase. Changing speed or color updates both alternating kernels
once. Repeating unchanged values produces no further uploads for that group.

## Timing

Circle emission at 3,000 births/second, lifetime two seconds, speed 100,
diameter 40, seed 1, simulated steps of 1/60 second, no modifiers or rendering.
Each implementation warms up for 150 updates.

Both implementations then run on the same WebGL context. Twenty-four rounds
alternate which implementation runs first; each sample contains thirty updates.
CPU measurements cover update submission. Separate
`EXT_disjoint_timer_query_webgl2` queries cover GPU work, including uploads.
Each query is polled asynchronously until available before proceeding.
All samples completed without disjoint queries or GL errors.
No particle, buffer, or framebuffer data is read back by this comparison.

Median batch time divided by thirty, in milliseconds per update:

| Capacity | CPU before | CPU after | GPU before | GPU after |
| -------- | ---------: | --------: | ---------: | --------: |
| 8,192    |     0.0667 |    0.0667 |     0.0796 |    0.0693 |
| 100,000  |     0.1000 |    0.0967 |     0.2531 |    0.2560 |

The large-capacity GPU difference is approximately 0.003 ms (1.1%). These
measurements show no material regression on this device, not a universal
speedup or a mobile-device guarantee. Earlier separate-context measurements
were noisier; the table uses the interleaved comparison.

Inputs are unpacked into named locals within the branches that use them,
avoiding an unconditional block of appearance and emission reads for every
particle-state band.

## Regression coverage

- Existing integration tests retain their original input values and expectations.
- Uniform-buffer tests cover unchanged steps followed by changes, two-buffer
  reuse, and isolation between update kernels.
- The browser upload check covers changed and unchanged speed and color values
  across both kernels.
- Minified Rolldown and Terser browser checks cover rendering, expiration, reset,
  prewarm, ordering, and shared-context integration.
