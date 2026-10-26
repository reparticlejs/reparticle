---
title: "EmitterConfig"
description: "Validated emitter data, including the shared rendering contract."
package: "core"
---

Validated emitter data, including the shared rendering contract.

## Properties

### capacity

> **capacity**: `number`

***

### duration

> **duration**: `number`

***

### durationSpread

> **durationSpread**: `number`

***

### emission

> **emission**: \{ `rate`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \}; \} = `emissionSchema`

#### rate

> **rate**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `emissionRateSchema`

#### rateSpread

> **rateSpread**: `number`

#### shape

> **shape**: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread`: `number`; \} = `emissionShapeSchema`

***

### id

> **id**: `string` = `emitterIdSchema`

***

### inheritVelocity

> **inheritVelocity**: `number`

***

### initial

> **initial**: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread`: `number`; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread`: `number`; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread`: `number`; `direction`: `number`; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread`: `number`; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread`: `number`; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread`: `number`; `size`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread`: `number`; `spread`: `number`; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread`: `number`; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread`: `number`; \} = `initialPropertiesSchema`

#### alpha

> **alpha**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### alphaSpread

> **alphaSpread**: `number`

#### angularVelocity

> **angularVelocity**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### angularVelocitySpread

> **angularVelocitySpread**: `number`

#### blue

> **blue**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### blueSpread

> **blueSpread**: `number`

#### direction

> **direction**: `number`

#### green

> **green**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### greenSpread

> **greenSpread**: `number`

#### lifetime

> **lifetime**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `scalarPropertySchema`

#### lifetimeSpread

> **lifetimeSpread**: `number`

#### red

> **red**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### redSpread

> **redSpread**: `number`

#### rotation

> **rotation**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### rotationSpread

> **rotationSpread**: `number`

#### size

> **size**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### sizeSpread

> **sizeSpread**: `number`

#### speed

> **speed**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `scalarPropertySchema`

#### speedSpread

> **speedSpread**: `number`

#### spread

> **spread**: `number`

#### stretchX

> **stretchX**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### stretchXSpread

> **stretchXSpread**: `number`

#### stretchY

> **stretchY**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### stretchYSpread

> **stretchYSpread**: `number`

***

### modifiers

> **modifiers**: (\{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number`; `spread`: `number`; `type`: `"drag"`; `useDirection`: `boolean`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `spread`: `number`; `type`: `"radial"`; `x`: `number`; `y`: `number`; \} \| \{ `magnitude`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance`: `number`; `rotation`: `number`; `spread`: `number`; `type`: `"vortex"`; `x`: `number`; `y`: `number`; \})[]

***

### orientation

> **orientation**: `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"`

***

### overLifetime

> **overLifetime**: \{ `alpha`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY`: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \} = `overLifetimeSchema`

#### alpha

> **alpha**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### angularVelocity

> **angularVelocity**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### blue

> **blue**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### green

> **green**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### red

> **red**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### rotation

> **rotation**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### scale

> **scale**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### stretchX

> **stretchX**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### stretchY

> **stretchY**: `number` \| \{ `points`: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

***

### playMode

> **playMode**: `"once"` \| `"loop"`

***

### position

> **position**: \{ `x`: `number`; `y`: `number`; \}

#### x

> **x**: `number`

#### y

> **y**: `number`

***

### rendering

> **rendering**: \{ `blendMode`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \} = `renderingSchema`

#### blendMode

> **blendMode**: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`

#### tint?

> `optional` **tint?**: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}

##### tint.alpha

> **alpha**: `number`

##### tint.blue

> **blue**: `number`

##### tint.green

> **green**: `number`

##### tint.red

> **red**: `number`

***

### rotation

> **rotation**: `number`

***

### scale

> **scale**: `number`

***

### seed

> **seed**: `number`

***

### space

> **space**: `"world"` \| `"local"`

***

### startDelay

> **startDelay**: `number`

***

### startDelaySpread

> **startDelaySpread**: `number`

***

### startOffset

> **startOffset**: `number`

***

### stretchWithVelocity

> **stretchWithVelocity**: `boolean`
