/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Source lives in app/ and the production build is published to the repository
// ROOT (see scripts/publish-to-root.mjs). That layout is what lets GitHub Pages
// serve this site in its default "Deploy from a branch -> main -> / (root)"
// mode: Pages copies the branch verbatim, so the files it finds at the root
// must already be the compiled output, not TypeScript sources.
//
// base stays relative ("./") so the exact same build works from the domain
// root, from a /REPOSITORY/ project path, or from a local preview subpath
// without any rebuild.
const BASE = "./";

export default defineConfig({
  root: "app",
  base: BASE,
  build: {
    target: "es2020",
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: false,
    cssMinify: true,
  },
  // Vite's root is app/, but the test suite lives beside the repo root, so
  // Vitest gets its own root back.
  test: {
    environment: "node",
    root: fileURLToPath(new URL(".", import.meta.url)),
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
          "Mutual Fund + Bank ROI analytics with an exact fixed weekly bank average-balance methodology.",
        // Relative to the manifest's own URL, so it resolves correctly whether
        // the app is hosted at a domain root or a GitHub Pages subpath.
        start_url: ".",
        scope: "./",
        display: "standalone",
        display_override: ["standalone", "minimal-ui", "browser"],
        orientation: "portrait-primary",
        background_color: "#f5f5f3",
        theme_color: "#ffffff",
        categories: ["finance", "productivity", "utilities"],
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
        globPatterns: ["**/*.{js,css,html,png,svg,webmanifest,woff2}"],
        // The font CSS declares every Unicode subset, but browsers only fetch
        // the ranges a page actually uses. Precaching the non-Latin subsets
        // would add ~1 MB to the offline cache for glyphs this app never
        // renders, so they stay network-only.
        globIgnores: ["**/*{cyrillic,greek,vietnamese}*.woff2"],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
