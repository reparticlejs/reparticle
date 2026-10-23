import { particleExamples } from './examples/particle-examples';
import { pylinkaExamples } from './examples/pylinka';
import { showcaseExamples } from './examples/showcase';
import { stressExamples } from './examples/stress-test';
import type { Example } from './types/example';

/** Dropdown order; the first entry is selected on startup. */
export const examples: readonly Example[] = [
  ...particleExamples,
  ...pylinkaExamples,
  ...showcaseExamples,
  ...stressExamples,
];
