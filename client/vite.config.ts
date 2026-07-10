import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    host: true,
    // Permite acessar o dev server via hosts externos (ex: preview em sandbox/tunnel).
    allowedHosts: true,
    proxy: {
      // Encaminha chamadas de API pro Express em dev, evita CORS local
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
  },
});
