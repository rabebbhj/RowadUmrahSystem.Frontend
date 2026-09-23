import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? "/app/" : "/",
  build: {
    outDir: "../RowadUmrahSystem.Backend/wwwroot/app",
    emptyOutDir: true
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5045",
        changeOrigin: true
      },
      "/Travelers": {
        target: "http://localhost:5045",
        changeOrigin: true
      },
      "/TravelerDocuments": {
        target: "http://localhost:5045",
        changeOrigin: true
      },
      "/uploads": {
        target: "http://localhost:5045",
        changeOrigin: true
      }
    }
  }
}));
