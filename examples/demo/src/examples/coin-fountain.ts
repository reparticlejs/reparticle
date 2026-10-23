import type { Example } from '../types/example';
import { createCoinArtwork } from './coin-artwork';

export const coinFountain: Example = {
  id: 'coin-fountain',
  name: 'Coin Fountain',
  file: 'effects/coin-fountain.json',
  artwork: createCoinArtwork('coin-fountain'),
};
