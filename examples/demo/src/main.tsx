import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app';

import './main.css';

const root = createRoot(document.getElementById('root')!);
root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Release Pixi and its listeners before Vite replaces this entry module.
import.meta.hot?.dispose(() => root.unmount());
