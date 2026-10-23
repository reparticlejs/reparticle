import type { Example } from '../types/example';
import { particleExamples } from './particle-examples';
import { pylinkaExamples } from './pylinka';
import { showcaseExamples } from './showcase';
import { stressExamples } from './stress-test';

/** Dropdown order; the first entry is selected on startup. */
export const examples: readonly Example[] = [
  ...particleExamples,
  ...pylinkaExamples,
  ...showcaseExamples,
  ...stressExamples,
];
