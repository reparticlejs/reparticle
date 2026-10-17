import { strictObject, number, int, string, literal, tuple } from "zod";

const emissionSchema = strictObject({
  rate: number().nonnegative(),
  shape: strictObject({ type: literal("point") }),
});

const initialPropertiesSchema = strictObject({
  lifetime: number().positive(),
  speed: number().nonnegative(),
  direction: number(),
  spread: number().nonnegative(),
});

const gravitySchema = strictObject({ x: literal(0), y: number() });
const modifiersSchema = strictObject({ gravity: gravitySchema });

/** Numeric updates only; shape, identity, capacity and seed require recreation. */
export const emitterParametersSchema = strictObject({
  emission: strictObject({ rate: number().nonnegative() }).partial().optional(),
  initial: initialPropertiesSchema.partial().optional(),
  modifiers: strictObject({ gravity: gravitySchema.partial().optional() }).optional(),
});

export const emitterConfigSchema = strictObject({
  id: string().refine((value) => value.trim().length > 0, "Expected a nonempty identifier"),
  capacity: int().min(1).max(1_000_000),
  seed: int().min(0).max(65535),
  emission: emissionSchema,
  initial: initialPropertiesSchema,
  modifiers: modifiersSchema,
});

/** Only implemented configuration features are accepted. */
export const effectConfigSchema = strictObject({
  version: literal(1),
  emitters: tuple([emitterConfigSchema]),
});
