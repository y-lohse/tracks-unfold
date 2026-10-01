import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/tracks-unfold/",
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        id: "/tracks-unfold/",
        name: "Tracks Unfold",
        short_name: "Tracks Unfold",
        description: "Awaken an impossible musical instrument.",
        start_url: "/tracks-unfold/",
        scope: "/tracks-unfold/",
        display: "standalone",
        theme_color: "#e3e1c9",
        background_color: "#e3e1c9",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{html,js,css,woff2,png,svg,webmanifest}"],
        navigateFallback: "index.html",
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
  },
});
