import type { Example } from '../types/example';
import { createCoinArtwork } from './coin-artwork';

export const spinningCoins: Example = {
  id: 'spinning-coins',
  name: 'Spinning Coins',
  file: 'effects/spinning-coins.json',
  artwork: createCoinArtwork('spinning-coins'),
  verticalPosition: 0,
  fullWidth: true,
};
