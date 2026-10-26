import type { Example } from './example';

/** Selected example, playback, and loading status displayed by the UI. */
export interface ExamplePlayerState {
  example: Example;
  paused: boolean;
  loading: boolean;
  error: string;
}
