---
title: "CurvePoint"
description: "Parsed curve point: time is normalized lifetime, value uses the property's\nunits, and tangent is the slope (change in value per unit of normalized time).\nThe same tangent applies on both sides of the point; it defaults to zero when\nomitted from JSON and is always present after parsing."
package: "core"
---

Parsed curve point: time is normalized lifetime, value uses the property's
units, and tangent is the slope (change in value per unit of normalized time).
The same tangent applies on both sides of the point; it defaults to zero when
omitted from JSON and is always present after parsing.

## Properties

### tangent

> **tangent**: `number`

***

### time

> **time**: `number`

***

### value

> **value**: `number`
