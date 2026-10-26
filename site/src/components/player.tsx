import { examples } from '@reparticle/examples';
import { Player } from '@reparticle/player';

/** The site chooses its featured effect; playback lives in the shared package. */
export default function SitePlayer({ gallery = false }: { gallery?: boolean }) {
  const initial = examples.find((example) => example.id === 'magical-aura') ?? examples[0];
  return <Player initialExample={initial} examples={examples} gallery={gallery} />;
}
