import type { EffectConfig } from '#types/effect.js';

import { effectConfigSchema } from './schema';

/** Validate parsed JSON before GPU allocation and return independent configuration data. */
export function parseEffectConfig(input: unknown): EffectConfig {
  return effectConfigSchema.parse(input);
}
