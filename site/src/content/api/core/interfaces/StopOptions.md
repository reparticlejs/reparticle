---
title: "StopOptions"
description: "Options for stopping births immediately, rather than retiring after the current loop."
package: "core"
---

Options for stopping births immediately, rather than retiring after the current loop.

## Properties

### clear?

> `optional` **clear?**: `boolean`

Remove existing particles immediately when true. Defaults to false, allowing
them to drain through continued updates. Sleeping is reported on a subsequent
update once the stopped emitter is confirmed empty, even when clearing.
