import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    // Builds index.html + all JS chunks into dist/
    // Deploy the entire dist/ folder to your server
  },
});
