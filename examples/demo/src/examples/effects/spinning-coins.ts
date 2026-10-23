import type { Example } from '../../types/example';
import { createCoinArtwork } from '../../utils/coin-artwork';

export const example: Example = {
  id: 'spinning-coins',
  name: 'Spinning Coins',
  file: 'effects/spinning-coins.json',
  artwork: createCoinArtwork('spinning-coins'),
  verticalPosition: 0,
  fullWidth: true,
};
