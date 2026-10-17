import type { z } from "zod";
import type { effectConfigSchema, emitterConfigSchema } from "#src/config/schema.js";

/** Validated effect definition; inferred from the runtime schema. */
export type EffectConfig = z.infer<typeof effectConfigSchema>;
export type EmitterConfig = z.infer<typeof emitterConfigSchema>;
