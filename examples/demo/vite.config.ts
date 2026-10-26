import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  publicDir: '../shared/public',
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' },
});
