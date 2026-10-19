import { execSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/**
 * De app is statisch: `npm run build` levert een map op die op elke statische
 * host (GitHub Pages, Netlify, een USB-stick) kan staan. Relatieve paden zorgen
 * dat het ook werkt onder een submap zoals /fitness-dashboard/.
 */
function buildId(): string {
  let commit = "onbekend";
  try {
    commit = execSync("git rev-parse --short HEAD").toString().trim();
  } catch {
    // Geen git beschikbaar; alleen de bouwtijd dan.
  }
  return `${commit} (${new Date().toISOString().slice(0, 16)})`;
}

export default defineConfig({
  base: process.env.BASE_PATH ?? "./",
  define: {
    __APP_BUILD__: JSON.stringify(buildId()),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      includeAssets: ["icons/icon.svg", "icons/apple-touch-icon.png"],
      manifest: {
        id: "trainlog",
        name: "Trainlog — training en voeding",
        short_name: "Trainlog",
        description:
          "Persoonlijke app voor trainingen, maaltijdplanning, boodschappen en voortgang. Werkt volledig offline.",
        lang: "nl",
        dir: "ltr",
        start_url: "./",
        scope: "./",
        display: "standalone",
        display_override: ["standalone", "minimal-ui"],
        orientation: "portrait",
        background_color: "#111317",
        theme_color: "#111317",
        categories: ["health", "fitness", "lifestyle"],
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          {
            src: "icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          { src: "icons/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
      workbox: {
        // Alles wat de app nodig heeft staat in de cache; data leeft in IndexedDB.
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: false,
        skipWaiting: false,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
