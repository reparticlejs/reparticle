---
title: "Transform"
description: "Transform from effect-local coordinates to world coordinates.\nApply local-X reflection, rotation, uniform scale, then translation.\nCoordinates use canvas orientation: +X points right and +Y points down.\n\nIdentity is { x: 0, y: 0, rotation: 0, scale: 1, handedness: 1 }.\nEffectTransform validates finite values when applying a full or partial update.\nThis representation has no independent X/Y scale or skew."
package: "core"
---

Transform from effect-local coordinates to world coordinates.
Apply local-X reflection, rotation, uniform scale, then translation.
Coordinates use canvas orientation: +X points right and +Y points down.

Identity is { x: 0, y: 0, rotation: 0, scale: 1, handedness: 1 }.
EffectTransform validates finite values when applying a full or partial update.
This representation has no independent X/Y scale or skew.

## Properties

### handedness

> **handedness**: `-1` \| `1`

1 preserves orientation; -1 reflects local X before rotation and scaling.

***

### rotation

> **rotation**: `number`

Counterclockwise degrees; values are not restricted to a single turn.

***

### scale

> **scale**: `number`

Dimensionless uniform scale. Zero collapses points to the effect origin;
negative values invert both axes, independently of handedness.

***

### x

> **x**: `number`

World X of the effect origin, in simulation units.

***

### y

> **y**: `number`

World Y of the effect origin, in simulation units.
