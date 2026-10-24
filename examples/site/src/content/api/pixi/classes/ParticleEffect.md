---
title: "ParticleEffect"
description: "An effect display object. Bounds and hit areas remain opt-in; textures belong to the caller."
package: "pixi"
---

An effect display object. Bounds and hit areas remain opt-in; textures belong to the caller.

## Extends

- `ViewContainer`

## Constructors

### Constructor

> **new ParticleEffect**(`definition`, `options?`): `ParticleEffect`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `definition` | \{ `emitters`: \[\{ `capacity`: `number`; `duration?`: `number`; `durationSpread?`: `number`; `emission`: \{ `rate`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread?`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread?`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread?`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread?`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread?`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread?`: `number`; \}; \}; `id`: `string`; `inheritVelocity?`: `number`; `initial`: \{ `alpha?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread?`: `number`; `angularVelocity?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread?`: `number`; `blue?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread?`: `number`; `direction`: `number`; `green?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread?`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread?`: `number`; `red?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread?`: `number`; `rotation?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread?`: `number`; `size?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread?`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread?`: `number`; `spread`: `number`; `stretchX?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread?`: `number`; `stretchY?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread?`: `number`; \}; `modifiers?`: (\{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"drag"`; `useDirection?`: `boolean`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `spread?`: `number`; `type`: `"radial"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `rotation?`: `number`; `spread?`: `number`; `type`: `"vortex"`; `x?`: `number`; `y?`: `number`; \})[]; `orientation?`: `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"`; `overLifetime?`: \{ `alpha?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \}; `playMode?`: `"once"` \| `"loop"`; `position?`: \{ `x?`: `number`; `y?`: `number`; \}; `rendering?`: \{ `blendMode?`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \}; `rotation?`: `number`; `scale?`: `number`; `seed`: `number`; `space?`: `"world"` \| `"local"`; `startDelay?`: `number`; `startDelaySpread?`: `number`; `startOffset?`: `number`; `stretchWithVelocity?`: `boolean`; \}, ...\{ capacity: number; duration?: number; durationSpread?: number; emission: \{ rate: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rateSpread?: number; shape: \{ type: "point" \} \| \{ diameter: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; diameterSpread?: number; type: "circle" \} \| \{ height: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; heightSpread?: number; type: "box"; width: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; widthSpread?: number \} \| \{ height: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; heightSpread?: number; type: "cone2d"; width: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; widthSpread?: number \} \}; id: string; inheritVelocity?: number; initial: \{ alpha?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; alphaSpread?: number; angularVelocity?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; angularVelocitySpread?: number; blue?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; blueSpread?: number; direction: number; green?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; greenSpread?: number; lifetime: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; lifetimeSpread?: number; red?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; redSpread?: number; rotation?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rotationSpread?: number; size?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; sizeSpread?: number; speed: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; speedSpread?: number; spread: number; stretchX?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; stretchXSpread?: number; stretchY?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; stretchYSpread?: number \}; modifiers?: (\{ magnitude?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rotation?: number; spread?: number; type: "acceleration" \} \| \{ magnitude?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rotation?: number; spread?: number; type: "drag"; useDirection?: boolean \} \| \{ magnitude?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; maxDistance?: number; spread?: number; type: "radial"; x?: number; y?: number \} \| \{ magnitude?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; maxDistance?: number; rotation?: number; spread?: number; type: "vortex"; x?: number; y?: number \})\[\]; orientation?: "default" \| "initial-direction" \| "movement-direction" \| "angular-velocity"; overLifetime?: \{ alpha?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; angularVelocity?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; blue?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; green?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; red?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rotation?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; scale?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; stretchX?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; stretchY?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \} \}; playMode?: "once" \| "loop"; position?: \{ x?: number; y?: number \}; rendering?: \{ blendMode?: "normal" \| "add" \| "multiply" \| "screen"; tint?: \{ alpha: number; blue: number; green: number; red: number \} \}; rotation?: number; scale?: number; seed: number; space?: "world" \| "local"; startDelay?: number; startDelaySpread?: number; startOffset?: number; stretchWithVelocity?: boolean \}\[\]\]; `modifiers?`: (\{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"drag"`; `useDirection?`: `boolean`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `spread?`: `number`; `type`: `"radial"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `rotation?`: `number`; `spread?`: `number`; `type`: `"vortex"`; `x?`: `number`; `y?`: `number`; \})[]; `version`: `1`; \} |
| `definition.emitters?` | \[\{ `capacity`: `number`; `duration?`: `number`; `durationSpread?`: `number`; `emission`: \{ `rate`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rateSpread?`: `number`; `shape`: \{ `type`: `"point"`; \} \| \{ `diameter`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `diameterSpread?`: `number`; `type`: `"circle"`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread?`: `number`; `type`: `"box"`; `width`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread?`: `number`; \} \| \{ `height`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `heightSpread?`: `number`; `type`: `"cone2d"`; `width`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `widthSpread?`: `number`; \}; \}; `id`: `string`; `inheritVelocity?`: `number`; `initial`: \{ `alpha?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `alphaSpread?`: `number`; `angularVelocity?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocitySpread?`: `number`; `blue?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blueSpread?`: `number`; `direction`: `number`; `green?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `greenSpread?`: `number`; `lifetime`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `lifetimeSpread?`: `number`; `red?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `redSpread?`: `number`; `rotation?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotationSpread?`: `number`; `size?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `sizeSpread?`: `number`; `speed`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `speedSpread?`: `number`; `spread`: `number`; `stretchX?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchXSpread?`: `number`; `stretchY?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchYSpread?`: `number`; \}; `modifiers?`: (\{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"drag"`; `useDirection?`: `boolean`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `spread?`: `number`; `type`: `"radial"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `rotation?`: `number`; `spread?`: `number`; `type`: `"vortex"`; `x?`: `number`; `y?`: `number`; \})[]; `orientation?`: `"default"` \| `"initial-direction"` \| `"movement-direction"` \| `"angular-velocity"`; `overLifetime?`: \{ `alpha?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `angularVelocity?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `blue?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `green?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `red?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `scale?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchX?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `stretchY?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; \}; `playMode?`: `"once"` \| `"loop"`; `position?`: \{ `x?`: `number`; `y?`: `number`; \}; `rendering?`: \{ `blendMode?`: `"normal"` \| `"add"` \| `"multiply"` \| `"screen"`; `tint?`: \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}; \}; `rotation?`: `number`; `scale?`: `number`; `seed`: `number`; `space?`: `"world"` \| `"local"`; `startDelay?`: `number`; `startDelaySpread?`: `number`; `startOffset?`: `number`; `stretchWithVelocity?`: `boolean`; \}, ...\{ capacity: number; duration?: number; durationSpread?: number; emission: \{ rate: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rateSpread?: number; shape: \{ type: "point" \} \| \{ diameter: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; diameterSpread?: number; type: "circle" \} \| \{ height: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; heightSpread?: number; type: "box"; width: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; widthSpread?: number \} \| \{ height: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; heightSpread?: number; type: "cone2d"; width: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; widthSpread?: number \} \}; id: string; inheritVelocity?: number; initial: \{ alpha?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; alphaSpread?: number; angularVelocity?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; angularVelocitySpread?: number; blue?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; blueSpread?: number; direction: number; green?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; greenSpread?: number; lifetime: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; lifetimeSpread?: number; red?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; redSpread?: number; rotation?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rotationSpread?: number; size?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; sizeSpread?: number; speed: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; speedSpread?: number; spread: number; stretchX?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; stretchXSpread?: number; stretchY?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; stretchYSpread?: number \}; modifiers?: (\{ magnitude?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rotation?: number; spread?: number; type: "acceleration" \} \| \{ magnitude?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rotation?: number; spread?: number; type: "drag"; useDirection?: boolean \} \| \{ magnitude?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; maxDistance?: number; spread?: number; type: "radial"; x?: number; y?: number \} \| \{ magnitude?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; maxDistance?: number; rotation?: number; spread?: number; type: "vortex"; x?: number; y?: number \})\[\]; orientation?: "default" \| "initial-direction" \| "movement-direction" \| "angular-velocity"; overLifetime?: \{ alpha?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; angularVelocity?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; blue?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; green?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; red?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; rotation?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; scale?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; stretchX?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \}; stretchY?: number \| \{ points: \{ tangent?: number; time: number; value: number \}\[\] \} \}; playMode?: "once" \| "loop"; position?: \{ x?: number; y?: number \}; rendering?: \{ blendMode?: "normal" \| "add" \| "multiply" \| "screen"; tint?: \{ alpha: number; blue: number; green: number; red: number \} \}; rotation?: number; scale?: number; seed: number; space?: "world" \| "local"; startDelay?: number; startDelaySpread?: number; startOffset?: number; stretchWithVelocity?: boolean \}\[\]\] |
| `definition.modifiers?` | (\{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"acceleration"`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `rotation?`: `number`; `spread?`: `number`; `type`: `"drag"`; `useDirection?`: `boolean`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `spread?`: `number`; `type`: `"radial"`; `x?`: `number`; `y?`: `number`; \} \| \{ `magnitude?`: `number` \| \{ `points`: \{ `tangent?`: `number`; `time`: `number`; `value`: `number`; \}[]; \}; `maxDistance?`: `number`; `rotation?`: `number`; `spread?`: `number`; `type`: `"vortex"`; `x?`: `number`; `y?`: `number`; \})[] |
| `definition.version?` | `1` |
| `options?` | [`ParticleEffectOptions`](../../interfaces/ParticleEffectOptions/) |

#### Returns

`ParticleEffect`

#### Overrides

`ViewContainer.constructor`

## Accessors

### autoUpdate

#### Get Signature

> **get** **autoUpdate**(): `boolean`

Disable automatic updates before driving update(seconds) yourself.

##### Returns

`boolean`

#### Set Signature

> **set** **autoUpdate**(`enabled`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `enabled` | `boolean` |

##### Returns

`void`

***

### awakeEmitters

#### Get Signature

> **get** **awakeEmitters**(): `number`

##### Returns

`number`

***

### emitter

#### Get Signature

> **get** **emitter**(): `Emitter`

Single-emitter convenience; multi-emitter callers must select by ID.

##### Returns

`Emitter`

***

### emitters

#### Get Signature

> **get** **emitters**(): `ReadonlyMap`\<`string`, `Emitter`\>

Read-only lookup; use getEmitter to require a known ID.

##### Returns

`ReadonlyMap`\<`string`, `Emitter`\>

***

### isPaused

#### Get Signature

> **get** **isPaused**(): `boolean`

Whether simulation updates are paused, independently of the ticker setting.

##### Returns

`boolean`

***

### isSleeping

#### Get Signature

> **get** **isSleeping**(): `boolean`

##### Returns

`boolean`

***

### texture

#### Get Signature

> **get** **texture**(): `Texture`\<`TextureSource`\<`any`\>\> \| `null`

##### Returns

`Texture`\<`TextureSource`\<`any`\>\> \| `null`

#### Set Signature

> **set** **texture**(`texture`): `void`

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `texture` | `Texture`\<`TextureSource`\<`any`\>\> \| `null` |

##### Returns

`void`

***

### ticker

#### Get Signature

> **get** **ticker**(): `Ticker`

##### Returns

`Ticker`

#### Set Signature

> **set** **ticker**(`ticker`): `void`

Transfer the listener without starting, stopping or destroying either ticker.

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `ticker` | `Ticker` |

##### Returns

`void`

## Methods

### addBounds()

> **addBounds**(`_bounds`): `void`

Override to supply local bounds; particle positions are never scanned or read back.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_bounds` | `Bounds` |

#### Returns

`void`

***

### clear()

> **clear**(): `void`

#### Returns

`void`

***

### containsPoint()

> **containsPoint**(`_point`): `boolean`

Automatic particle hit testing is disabled; consumers can assign Pixi's hitArea.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `_point` | `PointData` |

#### Returns

`boolean`

#### Overrides

`ViewContainer.containsPoint`

***

### destroy()

> **destroy**(): `void`

#### Returns

`void`

#### Overrides

`ViewContainer.destroy`

***

### getEmitter()

> **getEmitter**(`id`): `Emitter`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Emitter`

***

### getEmitterTexture()

> **getEmitterTexture**(`id`): `Texture`\<`TextureSource`\<`any`\>\> \| `null`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`Texture`\<`TextureSource`\<`any`\>\> \| `null`

***

### getEmitterTint()

> **getEmitterTint**(`id`): \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

\{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \}

##### alpha

> **alpha**: `number`

##### blue

> **blue**: `number`

##### green

> **green**: `number`

##### red

> **red**: `number`

***

### pause()

> **pause**(): `void`

Freeze particle movement, aging, and emission without changing autoUpdate.

#### Returns

`void`

***

### play()

> **play**(): `void`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

#### Returns

`void`

***

### resetEmitterTint()

> **resetEmitterTint**(`id`): `void`

Remove the override and restore the authored rendering tint.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |

#### Returns

`void`

***

### resume()

> **resume**(): `void`

Continue from the paused state. Manual updates remain manual.

#### Returns

`void`

***

### retire()

> **retire**(): `void`

Finish the current emission loop, then let remaining particles expire.

#### Returns

`void`

***

### setEmitterBlendMode()

> **setEmitterBlendMode**(`id`, `blendMode`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `blendMode` | `NonNullable`\<`"normal"` \| `"add"` \| `"multiply"` \| `"screen"` \| `undefined`\> |

#### Returns

`void`

***

### setEmitterTexture()

> **setEmitterTexture**(`id`, `options`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `options` | [`ParticleTexture`](../../types/ParticleTexture/) |

#### Returns

`void`

***

### setEmitterTint()

> **setEmitterTint**(`id`, `tint`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | `string` |
| `tint` | \{ `alpha`: `number`; `blue`: `number`; `green`: `number`; `red`: `number`; \} |
| `tint.alpha?` | `number` |
| `tint.blue?` | `number` |
| `tint.green?` | `number` |
| `tint.red?` | `number` |

#### Returns

`void`

***

### setTexture()

> **setTexture**(`options`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ParticleTexture`](../../types/ParticleTexture/) |

#### Returns

`void`

***

### stop()

> **stop**(`options?`): `void`

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | `StopOptions` |

#### Returns

`void`

***

### update()

> **update**(`seconds`): `void`

Advance initialized simulations unless paused. Playback waits for the first render.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `seconds` | `number` |

#### Returns

`void`
