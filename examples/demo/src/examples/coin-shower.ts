import type { Example } from '../types/example';
import { createCoinArtwork } from './coin-artwork';

export const coinShower: Example = {
  id: 'coin-shower',
  name: 'Coin Shower',
  file: 'effects/coin-shower.json',
  artwork: createCoinArtwork('coin-shower'),
  verticalPosition: 0,
  fullWidth: true,
};
