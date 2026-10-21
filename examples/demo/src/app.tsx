import { useState } from 'react';

import { Demo } from './demo';

export function App() {
  const [multiple, setMultiple] = useState(false);

  return <Demo key={String(multiple)} multiple={multiple} onSelect={setMultiple} />;
}
