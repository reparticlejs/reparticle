import { effectConfigSchema } from '#config/schemas/definition/effect.js';
import type { EffectConfig } from '#types/effect.js';

/** Validate parsed JSON before GPU allocation and return independent configuration data. */
export function parseEffectConfig(input: unknown): EffectConfig {
  return effectConfigSchema.parse(input);
}
