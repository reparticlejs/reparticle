import type { Example } from '@reparticle/player/types';

import { createCoinArtwork } from '../../utils/coin-artwork';

export const example: Example = {
  id: 'coin-shower',
  name: 'Coin Shower',
  file: 'effects/coin-shower.json',
  artwork: createCoinArtwork('coin-shower'),
  verticalPosition: 0,
  fullWidth: true,
};
