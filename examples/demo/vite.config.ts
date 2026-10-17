import { defineConfig } from "vite";
export default defineConfig({
  server: { host: "0.0.0.0" },
  preview: { host: "0.0.0.0" },
  resolve: {
    alias: {
      "@reparticle/core": new URL("../../packages/core/src/index.ts", import.meta.url).pathname,
      "@reparticle/pixi": new URL("../../packages/pixi/src/index.ts", import.meta.url).pathname,
    },
  },
});
