import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    rollupOptions: {
      input: "index.html",
    },
  },
  resolve: {
    alias: {
      // Workaround: wagmi 2.19.x has internal ./tempo paths that vite can't resolve
      "@wagmi/core/tempo": "@wagmi/core",
    },
  },
});
