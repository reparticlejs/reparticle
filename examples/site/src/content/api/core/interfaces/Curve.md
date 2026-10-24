---
title: "Curve"
description: "Parsed scalar curve with at least one point and strictly increasing times.\nPoint times lie in [0, 1], but points at both endpoints are not required.\n\nAdjacent points use cubic Hermite interpolation. A single point describes a\nline with that point's tangent. This is authored curve data, not the float32\nsamples used during playback; boundary handling belongs to the evaluator."
package: "core"
---

Parsed scalar curve with at least one point and strictly increasing times.
Point times lie in [0, 1], but points at both endpoints are not required.

Adjacent points use cubic Hermite interpolation. A single point describes a
line with that point's tangent. This is authored curve data, not the float32
samples used during playback; boundary handling belongs to the evaluator.

## Properties

### points

> **points**: \{ `tangent`: `number`; `time`: `number`; `value`: `number`; \}[]

#### tangent

> **tangent**: `number`

#### time

> **time**: `number`

#### value

> **value**: `number`
