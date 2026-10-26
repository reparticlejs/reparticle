import type { Example } from '@reparticle/player/types';

import { createCoinArtwork } from '../../utils/coin-artwork';

export const example: Example = {
  id: 'coin-fountain',
  name: 'Coin Fountain',
  file: 'effects/coin-fountain.json',
  artwork: createCoinArtwork('coin-fountain'),
};
