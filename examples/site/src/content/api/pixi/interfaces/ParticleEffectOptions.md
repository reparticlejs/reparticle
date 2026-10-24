---
title: "ParticleEffectOptions"
description: "Pixi artwork bindings and runtime integration, separate from the effect definition."
package: "pixi"
---

Pixi artwork bindings and runtime integration, separate from the effect definition.

## Properties

### autoUpdate?

> `optional` **autoUpdate?**: `boolean`

Defaults to true. Disable when calling update(seconds) yourself.

***

### emitters?

> `optional` **emitters?**: `Readonly`\<`Record`\<`string`, [`ParticleTexture`](../../types/ParticleTexture/)\>\>

Artwork keyed by emitter ID. Omitted emitters use procedural particles.

***

### ticker?

> `optional` **ticker?**: `Ticker`

Defaults to Ticker.shared. The effect does not own this ticker.
