import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE || "/",
  server: {
    // During development the React app runs on 5173 and the API on 4000.
    // Requests to /api are forwarded so the browser sees one origin.
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/test/setup.js",
    globalSetup: "./src/test/globalSetup.js",
    env: { VITE_API_BASE: "http://127.0.0.1:4999" },
    css: false,
    fileParallelism: false,
  },
});
