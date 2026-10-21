import { useState } from 'react';

import { Demo } from './demo';
import { examples } from './examples';

export function App() {
  const [example, setExample] = useState(examples[0]!);

  return <Demo key={example.id} example={example} onSelect={setExample} />;
}
