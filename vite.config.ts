/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves this project from a repository subpath
// (https://USERNAME.github.io/REPOSITORY/), and the exact subpath is not
// knowable at author time. Using a relative base ("./") makes every emitted
// asset reference (JS, CSS, icons, manifest) relative to index.html instead
// of rooted at "/", so the same build works unmodified from "/", from a
// GitHub Pages project path, or from a local `vite preview` subpath.
const BASE = "./";

export default defineConfig({
  base: BASE,
  build: {
    target: "es2020",
    sourcemap: true,
    outDir: "dist",
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: [
        "icons/favicon-16.png",
        "icons/favicon-32.png",
        "icons/apple-touch-icon-180.png",
      ],
      manifest: {
        id: ".",
        name: "Combined MF + Bank ROI Calculator",
        short_name: "MF+Bank ROI",
        description:
          "Production-grade Mutual Fund + Bank ROI analytics calculator with exact bank average-balance methodology.",
        // Relative to the manifest file's own URL, so it resolves correctly
        // whether the app is hosted at the domain root or at a GitHub Pages
        // repository subpath.
        start_url: ".",
        scope: "./",
        display: "standalone",
        display_override: ["standalone", "browser"],
        orientation: "portrait-primary",
        background_color: "#ffffff",
        theme_color: "#ffffff",
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest}"],
        // Every navigation falls back to the cached app shell so the app
        // keeps working offline and after a hard refresh, even though the
        // request URL differs per GitHub Pages subpath deployment.
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
