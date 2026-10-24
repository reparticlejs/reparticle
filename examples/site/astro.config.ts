import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  markdown: { shikiConfig: { theme: 'github-dark-dimmed' } },
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  redirects: {
    '/api/particle-effect/': '/api/pixi/classes/ParticleEffect/',
    '/api/effect-config/': '/api/core/interfaces/EffectInput/',
    '/api/textures/': '/api/pixi/types/ParticleTexture/',
  },
  // Serve the same effects and artwork as the standalone demo.
  publicDir: '../demo/public',
  devToolbar: { enabled: false },
});
