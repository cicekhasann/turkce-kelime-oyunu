import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/tdk": {
        target: "https://sozluk.gov.tr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/tdk/, "/gts"),
      },
    },
  },
});
