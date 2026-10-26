---
title: Particle architecture
---

reparticle separates particle simulation from rendering. `@reparticle/core` owns
effect validation, playback, particle allocation, and WebGL2 simulation.
`@reparticle/pixi` connects the engine to PixiJS. PixiJS is the first and primary
renderer, and the only renderer currently available.

## Coverage inventory

Effects contain named emitters with point, circle, box, or cone shapes. They support
local and world space, emission and lifetime curves, property variation, and ordered
acceleration, drag, radial, and vortex modifiers. Pixi adds textures, animation,
transforms, tint, blend modes, masks, filters, and render textures.

Particles occupy fixed slots. When capacity is full, extra births are dropped;
living particles are preserved. Rendering uses slot order, without depth or
lifetime sorting.

## Shader build

Simulation functions live in `packages/core/src/simulation`. They are written in
TypeScript with TypeGPU and compiled to GLSL by `scripts/build-shaders.ts`.
The build writes `src/simulation/shaders.json`; edit the TypeScript and GLSL
templates, then rebuild core instead of editing that generated file.

TypeGPU and its compiler are build dependencies only. Applications receive the
generated GLSL and need no compiler plugin. WebGL still compiles and links the
GLSL for the device when the first simulation acquires its program.

## Particle storage

Each emitter owns two alternating state textures and one birth-data texture.
The renderer borrows them directly; normal playback does not read particle state
back to the CPU.

| Storage        | Fields per particle                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Changing state | Position, velocity, age, active flag, accumulated rotation, movement heading                       |
| Birth data     | Lifetime, size, initial rotation, modifier variation, color, angular velocity, stretch, handedness |

The CPU tracks allocation, lifetime, and live count. It uploads accepted birth slots
as a packed mask. Other simulation inputs use a uniform buffer. Curves and modifier
records are read from that buffer without copying whole arrays in the shader.

`data-layout.ts` defines sizes and logical bands. `storage.ts` reconstructs those
logical bands from the physical textures. The GLSL wrapper packs results back into
the physical layout.

## Update flow

1. Advance playback and decide which free slots receive births.
2. Sample emitter settings, transforms, curves, and modifiers.
3. Upload changed inputs and the birth mask.
4. Write birth properties for newly allocated slots, preserving other slots.
5. Advance state into the other state texture, then swap the read/write targets.

Newborn particles receive the first step of motion immediately. Existing particles
keep their previous position when they expire and stop contributing to rendering.
A zero-time update preserves existing state.

Emitter modifiers run before effect modifiers, in authored order. Forces change
velocity before position advances. The kernels keep birth initialization separate
from existing-particle updates, with named shader inputs in `types/shader-inputs.ts`.

## Programs and ownership

Emitters in the same WebGL context share a compiled simulation program. Each emitter
owns its textures, framebuffers, uniform buffer, and vertex array. Releasing one
emitter does not invalidate the others; the last release deletes the shared program.

The host renderer owns the WebGL context. Pixi supplies its context to core and
restores rendering state after simulation work. Drawing reads the current particle
textures without advancing simulation.

`ParticleEffect` creates GPU resources on its first render. The supplied ticker
drives subsequent updates; long automatic updates are split into smaller steps.
`pause()` and `resume()` preserve playback position. `stop()` stops births,
`retire()` finishes the current emission loop, and `reset()` restarts the effect.

Artwork and tickers are borrowed. Destroying an effect releases its resources,
not the application's textures. Bounds and hit areas must be supplied when needed.

## Requirements and verification

The current backend requires WebGL2 and floating-point render targets
(`EXT_color_buffer_float`). There is no WebGPU backend or CPU fallback.
Live effects belong to one renderer context; context-loss recovery is not supported.

Run `pnpm check` for formatting, lint, types, tests, and production builds.
Core browser tests exercise generated shaders; Pixi browser tests cover rendering,
masks, filters, playback, and shared-resource ownership. See the site's Development
guide for browser installation and API generation commands.
