// import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc"; // Desabilitado devido a problemas com Vite 7
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
// import { vitePluginManusRuntime } from "vite-plugin-manus-runtime"; // Desabilitado temporariamente devido a problemas com Vite 7


// Configurar plugins com tratamento de erros
// Nota: Alguns plugins podem causar problemas com Vite 7
// Desabilitados temporariamente devido ao erro "No matching HTML proxy module"
const plugins = [
  react(),
  tailwindcss(),
  // Desabilitar jsxLocPlugin temporariamente devido a problemas com Vite 7
  // jsxLocPlugin(),
  // Desabilitar vitePluginManusRuntime temporariamente devido a problemas com Vite 7
  // vitePluginManusRuntime(),
].filter(Boolean);

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0', // Escutar em todas as interfaces de rede
    allowedHosts: 'all', // Permitir todos os hosts (incluindo Tailscale Funnel .ts.net)
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    hmr: {
      overlay: false,
      host: '0.0.0.0', // Permitir HMR de qualquer IP da rede
    },
    // Desabilitar HTML proxy para evitar erros com Vite 7
    proxy: undefined,
  },
});
