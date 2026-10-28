import { fileURLToPath } from 'node:url';

/** Shared example JSON and artwork used by unit and browser tests. */
export const testAliases = {
  '#effect-example': fileURLToPath(
    new URL('../../site/src/content/effect.example.json', import.meta.url),
  ),
  '#examples': fileURLToPath(new URL('../../examples/shared/public', import.meta.url)),
};
