---
title: "EmitterInput"
description: "Emitter authoring input before defaults and validation."
package: "core"
---

Emitter authoring input before defaults and validation.

## Properties

### capacity

> **capacity**: `number`

***

### duration?

> `optional` **duration?**: `number`

***

### durationSpread?

> `optional` **durationSpread?**: `number`

***

### emission

> **emission**: \{ `rate`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread?`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread?`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread?`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread?`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread?`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread?`: `number`; \}; \} = `emissionSchema`

#### rate

> **rate**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `emissionRateSchema`

#### rateSpread?

> `optional` **rateSpread?**: `number`

#### shape

> **shape**: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread?`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread?`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread?`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread?`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread?`: `number`; \} = `emissionShapeSchema`

***

### id

> **id**: `string` = `emitterIdSchema`

***

### inheritVelocity?

> `optional` **inheritVelocity?**: `number`

***

### initial

> **initial**: \{ `alpha?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread?`: `number`; `angularVelocity?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread?`: `number`; `blue?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread?`: `number`; `direction`: `number`; `green?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread?`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread?`: `number`; `red?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread?`: `number`; `rotation?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread?`: `number`; `size?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread?`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread?`: `number`; `spread`: `number`; `stretchX?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread?`: `number`; `stretchY?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread?`: `number`; \} = `initialPropertiesSchema`

#### alpha?

> `optional` **alpha?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### alphaSpread?

> `optional` **alphaSpread?**: `number`

#### angularVelocity?

> `optional` **angularVelocity?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### angularVelocitySpread?

> `optional` **angularVelocitySpread?**: `number`

#### blue?

> `optional` **blue?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### blueSpread?

> `optional` **blueSpread?**: `number`

#### direction

> **direction**: `number`

#### green?

> `optional` **green?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### greenSpread?

> `optional` **greenSpread?**: `number`

#### lifetime

> **lifetime**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `scalarPropertySchema`

#### lifetimeSpread?

> `optional` **lifetimeSpread?**: `number`

#### red?

> `optional` **red?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### redSpread?

> `optional` **redSpread?**: `number`

#### rotation?

> `optional` **rotation?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### rotationSpread?

> `optional` **rotationSpread?**: `number`

#### size?

> `optional` **size?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### sizeSpread?

> `optional` **sizeSpread?**: `number`

#### speed

> **speed**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \} = `scalarPropertySchema`

#### speedSpread?

> `optional` **speedSpread?**: `number`

#### spread

> **spread**: `number`

#### stretchX?

> `optional` **stretchX?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### stretchXSpread?

> `optional` **stretchXSpread?**: `number`

#### stretchY?

> `optional` **stretchY?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### stretchYSpread?

> `optional` **stretchYSpread?**: `number`

***

### modifiers?

> `optional` **modifiers?**: (\{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"drag"`; `useDirection?`: `boolean`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `spread?`: `number`; `type`: `"radial"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `rotation?`: `number`; `spread?`: `number`; `type`: `"vortex"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale?`: `number`; `seed?`: `number`; `speed?`: `number`; `spread?`: `number`; `type`: `"noise"`; \})[]

***

### orientation?

> `optional` **orientation?**: `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"`

***

### overLifetime?

> `optional` **overLifetime?**: \{ `alpha?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \} = `overLifetimeSchema`

#### alpha?

> `optional` **alpha?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### angularVelocity?

> `optional` **angularVelocity?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### blue?

> `optional` **blue?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### green?

> `optional` **green?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### red?

> `optional` **red?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### rotation?

> `optional` **rotation?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### scale?

> `optional` **scale?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### stretchX?

> `optional` **stretchX?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

#### stretchY?

> `optional` **stretchY?**: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}

***

### playMode?

> `optional` **playMode?**: `"once"` \| `"loop"`

***

### position?

> `optional` **position?**: \{ `x?`: `number`; `y?`: `number`; \}

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### rendering?

> `optional` **rendering?**: \{ `blendMode?`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \} = `renderingSchema`

#### blendMode?

> `optional` **blendMode?**: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`

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

### rotation?

> `optional` **rotation?**: `number`

***

### scale?

> `optional` **scale?**: `number`

***

### seed

> **seed**: `number`

***

### space?

> `optional` **space?**: `"world"` \| `"local"`

***

### startDelay?

> `optional` **startDelay?**: `number`

***

### startDelaySpread?

> `optional` **startDelaySpread?**: `number`

***

### startOffset?

> `optional` **startOffset?**: `number`

***

### stretchWithVelocity?

> `optional` **stretchWithVelocity?**: `boolean`
