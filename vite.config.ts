import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      "/api/gemini": {
        target: "https://generativelanguage.googleapis.com",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gemini/, ""),
      },
      "/api/openrouter": {
        target: "https://openrouter.ai/api",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/openrouter/, ""),
      },
    },
  },
});
