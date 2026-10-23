import type { Example } from '../types/example';
import { blackHole } from './black-hole';
import { campfire } from './campfire';
import { candleFlame } from './candle-flame';
import { celebrationCracker } from './celebration-cracker';
import { coinFountain } from './coin-fountain';
import { coinShower } from './coin-shower';
import { coinSparkTrail } from './coin-spark-trail';
import { confetti } from './confetti';
import { cyclone } from './cyclone';
import { debrisExplosion } from './debris-explosion';
import { easePop } from './ease-pop';
import { emberRise } from './ember-rise';
import { energy } from './energy';
import { explosion } from './explosion';
import { fallingLeaves } from './falling-leaves';
import { firePlumeAnim } from './fire-plume-anim';
import { fireball } from './fireball';
import { fireworks } from './fireworks';
import { flies } from './flies';
import { fog } from './fog';
import { infinityLoop } from './infinity-loop';
import { loading } from './loading';
import { magicImpact } from './magic-impact';
import { magicalAura } from './magical-aura';
import { metalSparks } from './metal-sparks';
import { nebula } from './nebula';
import { portal } from './portal';
import { rain } from './rain';
import { smoke } from './smoke';
import { snowstorm } from './snowstorm';
import { softSmoke } from './soft-smoke';
import { spinningCoins } from './spinning-coins';
import { starSparkle } from './star-sparkle';
import { stardustFall } from './stardust-fall';
import { steamPlume } from './steam-plume';
import { tornado } from './tornado';
import { waterStream } from './water-stream';
import { wispySmokeAnim } from './wispy-smoke-anim';

/** Dropdown order; the first entry is selected on startup. */
export const examples: readonly Example[] = [
  energy,
  explosion,
  celebrationCracker,
  candleFlame,
  loading,
  smoke,
  fog,
  confetti,
  emberRise,
  easePop,
  starSparkle,
  rain,
  stardustFall,
  nebula,
  coinShower,
  coinFountain,
  blackHole,
  cyclone,
  spinningCoins,
  softSmoke,
  steamPlume,
  firePlumeAnim,
  wispySmokeAnim,
  coinSparkTrail,
  infinityLoop,
  waterStream,
  fallingLeaves,
  fireball,
  fireworks,
  portal,
  tornado,
  flies,
  campfire,
  metalSparks,
  magicImpact,
  magicalAura,
  debrisExplosion,
  snowstorm,
];
