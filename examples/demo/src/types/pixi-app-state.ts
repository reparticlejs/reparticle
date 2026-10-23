import type { ExamplePlayer } from './example-player';

/** UI state: the player can exist while its next example is still loading. */
export interface PixiAppState {
  player: ExamplePlayer | undefined;
  exampleReady: boolean;
  error: string;
}
