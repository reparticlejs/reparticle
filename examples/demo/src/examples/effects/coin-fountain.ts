import type { Example } from '../../types/example';
import { createCoinArtwork } from '../../utils/coin-artwork';

export const example: Example = {
  id: 'coin-fountain',
  name: 'Coin Fountain',
  file: 'effects/coin-fountain.json',
  artwork: createCoinArtwork('coin-fountain'),
};
