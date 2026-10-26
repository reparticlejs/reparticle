---
title: "EmitterContext"
description: "Renderer-owned resources borrowed by an emitter's GPU simulation.\nSimulation and rendering share a context so particle textures can be consumed\ndirectly on the GPU. Destroying the emitter does not destroy these resources."
package: "core"
---

Renderer-owned resources borrowed by an emitter's GPU simulation.
Simulation and rendering share a context so particle textures can be consumed
directly on the GPU. Destroying the emitter does not destroy these resources.

## Properties

### assertAvailable?

> `optional` **assertAvailable?**: () => `void`

Optional host guard, called before simulation operations mutate CPU or GPU state.

#### Returns

`void`

***

### canvas

> **canvas**: `HTMLCanvasElement`

Canvas belonging to gl; borrowed and never resized by the simulation.

***

### gl

> **gl**: `WebGL2RenderingContext`

Shared WebGL2 context; simulation requires EXT_color_buffer_float support.

***

### restoreState?

> `optional` **restoreState?**: () => `void`

Restore the host's graphics state after GPU work, including failures, before notifications.

#### Returns

`void`
