import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://reparticlejs.github.io',
  base: process.env.SITE_BASE ?? '/',
  trailingSlash: 'always',
  markdown: { shikiConfig: { theme: 'github-dark-dimmed' } },
  integrations: [react()],
  vite: { plugins: [tailwindcss()] },
  redirects: {
    '/api/particle-effect/': '/api/pixi/classes/ParticleEffect/',
    '/api/effect-config/': '/api/core/interfaces/EffectInput/',
    '/api/textures/': '/api/pixi/types/ParticleTexture/',
  },
  // Serve the same effects and artwork as the standalone demo.
  publicDir: '../examples/shared/public',
  devToolbar: { enabled: false },
});
