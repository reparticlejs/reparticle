# @reparticle/core

The reparticle GPU particle engine: effect definitions, validation, and simulation.

For PixiJS applications, install [@reparticle/pixi](https://www.npmjs.com/package/@reparticle/pixi).
It includes the core engine.

[Documentation and examples](https://github.com/reparticlejs/reparticle)

## Validation schemas

`parseEffectConfig(input)` validates an effect and applies defaults. For validation
without throwing, use `effectConfigSchema.safeParse(input)` and inspect
`result.error.issues` when `result.success` is false.

`effectConfigSchema`, `emitterConfigSchema`, and `renderingSchema` are Zod Mini
schemas. Compose them with functions from `zod/mini`, such as
`optional(effectConfigSchema)`. Generate JSON Schema with
`toJSONSchema(effectConfigSchema, { io: 'input' })` from `zod/mini`.
Classic Zod methods such as `.optional()`, `.extend()`, and `.toJSONSchema()` are
not available. Thrown validation errors are Mini's `$ZodError` instances with an
`issues` array; use formatting functions from `zod/mini` instead of error methods.

## License

MIT
