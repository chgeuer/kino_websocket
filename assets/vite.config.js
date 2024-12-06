// https://vitejs.dev/config/
import { defineConfig } from "vite";
export default defineConfig({
  root: "./src/",
  plugins: [],
  build: {
    outDir: "../lib/assets/html",
    manifest: true,
    rollupOptions: {
      preserveEntrySignatures: "exports-only",
      input: "./src/main.js",
      output: {
        dir: "../lib/assets/html",
        entryFileNames: "main.js",
        assetFileNames: "main.css",
      },
    },
  },
});
