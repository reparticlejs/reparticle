import type { ExampleArtwork } from '../types/example-artwork';

const coinColors = ['gold', 'ruby', 'emerald', 'sapphire', 'amethyst', 'rose', 'silver'];

/** Coin effects use one emitter per color, named `<effect>-<color>` in their JSON. */
export function createCoinArtwork(effect: string): Record<string, ExampleArtwork> {
  const artwork: Record<string, ExampleArtwork> = {};

  for (const color of coinColors) {
    artwork[`${effect}-${color}`] = {
      source: 'pylinka/textures/coins.json',
      animation: `coin_${color}`,
      playback: 'loop-forward',
      fps: 14,
    };
  }

  return artwork;
}
