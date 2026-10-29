---
title: "EmitterParameters"
description: "Input patch for changing an existing emitter through setParameters().\nOmitted fields retain their current values; a supplied modifier list replaces\nthe whole list. Only fields exposed by the runtime schema can be changed.\n\nUses the schema's input type so callers may omit modifier fields with defaults.\nmergeEmitterParameters() validates the patch and the resulting complete definition."
package: "core"
---

Input patch for changing an existing emitter through setParameters().
Omitted fields retain their current values; a supplied modifier list replaces
the whole list. Only fields exposed by the runtime schema can be changed.

Uses the schema's input type so callers may omit modifier fields with defaults.
mergeEmitterParameters() validates the patch and the resulting complete definition.

## Properties

### emission?

> `optional` **emission?**: \{ `rate?`: `number`; `shape?`: \{ `diameter?`: `number`; `diameterSpread?`: `number`; `height?`: `number`; `heightSpread?`: `number`; `width?`: `number`; `widthSpread?`: `number`; \}; \}

#### rate?

> `optional` **rate?**: `number`

#### shape?

> `optional` **shape?**: \{ `diameter?`: `number`; `diameterSpread?`: `number`; `height?`: `number`; `heightSpread?`: `number`; `width?`: `number`; `widthSpread?`: `number`; \} = `shapeSchema`

##### shape.diameter?

> `optional` **diameter?**: `number`

##### shape.diameterSpread?

> `optional` **diameterSpread?**: `number`

##### shape.height?

> `optional` **height?**: `number`

##### shape.heightSpread?

> `optional` **heightSpread?**: `number`

##### shape.width?

> `optional` **width?**: `number`

##### shape.widthSpread?

> `optional` **widthSpread?**: `number`

***

### inheritVelocity?

> `optional` **inheritVelocity?**: `number`

***

### initial?

> `optional` **initial?**: \{ `alpha?`: `number`; `alphaSpread?`: `number`; `angularVelocity?`: `number`; `angularVelocitySpread?`: `number`; `blue?`: `number`; `blueSpread?`: `number`; `direction?`: `number`; `green?`: `number`; `greenSpread?`: `number`; `lifetime?`: `number`; `lifetimeSpread?`: `number`; `red?`: `number`; `redSpread?`: `number`; `rotation?`: `number`; `rotationSpread?`: `number`; `size?`: `number`; `sizeSpread?`: `number`; `speed?`: `number`; `speedSpread?`: `number`; `spread?`: `number`; `stretchX?`: `number`; `stretchXSpread?`: `number`; `stretchY?`: `number`; `stretchYSpread?`: `number`; \}

#### alpha?

> `optional` **alpha?**: `number`

#### alphaSpread?

> `optional` **alphaSpread?**: `number`

#### angularVelocity?

> `optional` **angularVelocity?**: `number`

#### angularVelocitySpread?

> `optional` **angularVelocitySpread?**: `number`

#### blue?

> `optional` **blue?**: `number`

#### blueSpread?

> `optional` **blueSpread?**: `number`

#### direction?

> `optional` **direction?**: `number`

#### green?

> `optional` **green?**: `number`

#### greenSpread?

> `optional` **greenSpread?**: `number`

#### lifetime?

> `optional` **lifetime?**: `number`

#### lifetimeSpread?

> `optional` **lifetimeSpread?**: `number`

#### red?

> `optional` **red?**: `number`

#### redSpread?

> `optional` **redSpread?**: `number`

#### rotation?

> `optional` **rotation?**: `number`

#### rotationSpread?

> `optional` **rotationSpread?**: `number`

#### size?

> `optional` **size?**: `number`

#### sizeSpread?

> `optional` **sizeSpread?**: `number`

#### speed?

> `optional` **speed?**: `number`

#### speedSpread?

> `optional` **speedSpread?**: `number`

#### spread?

> `optional` **spread?**: `number`

#### stretchX?

> `optional` **stretchX?**: `number`

#### stretchXSpread?

> `optional` **stretchXSpread?**: `number`

#### stretchY?

> `optional` **stretchY?**: `number`

#### stretchYSpread?

> `optional` **stretchYSpread?**: `number`

***

### modifiers?

> `optional` **modifiers?**: (\{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"drag"`; `useDirection?`: `boolean`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `spread?`: `number`; `type`: `"radial"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `rotation?`: `number`; `spread?`: `number`; `type`: `"vortex"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale?`: `number`; `seed?`: `number`; `speed?`: `number`; `spread?`: `number`; `type`: `"noise"`; \})[]

***

### position?

> `optional` **position?**: \{ `x?`: `number`; `y?`: `number`; \}

#### x?

> `optional` **x?**: `number`

#### y?

> `optional` **y?**: `number`

***

### rotation?

> `optional` **rotation?**: `number`

***

### scale?

> `optional` **scale?**: `number`

***

### stretchWithVelocity?

> `optional` **stretchWithVelocity?**: `boolean`
