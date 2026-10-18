import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';
import { MultiplePreview } from './components/multiple-preview';

import './main.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    {new URLSearchParams(window.location.search).has('multiple') ? <MultiplePreview /> : <App />}
  </StrictMode>,
);
import.meta.hot?.dispose(() => root.unmount());
