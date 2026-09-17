// Publishes the Vite build (dist/) to the repository ROOT.
//
// GitHub Pages is configured in its default "Deploy from a branch -> main ->
// / (root)" mode, which copies the branch contents verbatim with no build
// step. Serving raw sources there is what breaks the app (browsers refuse a
// `<script type="module" src="src/main.ts">` because Pages sends TypeScript as
// video/mp2t), so the compiled output has to be committed at the root instead.
//
// Only generated paths are touched; everything else in the repo is left alone.
import {
  cp,
  mkdir,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.join(ROOT, "dist");

// Generated entries that publish-to-root owns at the repository root. Anything
// listed here is removed before copying so stale hashed assets never linger.
const OWNED = [
  "index.html",
  "assets",
  "icons",
  "manifest.webmanifest",
  "registerSW.js",
  "sw.js",
  "workbox-*.js",
];

async function removeOwned() {
  const entries = await readdir(ROOT);
  for (const entry of entries) {
    const owned = OWNED.some((pattern) =>
      pattern.includes("*")
        ? new RegExp(`^${pattern.replace(/\./g, "\\.").replace(/\*/g, ".*")}$`).test(entry)
        : pattern === entry,
    );
    if (owned) {
      await rm(path.join(ROOT, entry), { recursive: true, force: true });
    }
  }
}

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ not found — run `npm run build` first.");
    process.exit(1);
  }

  await removeOwned();

  const entries = await readdir(DIST);
  for (const entry of entries) {
    const from = path.join(DIST, entry);
    const to = path.join(ROOT, entry);
    const info = await stat(from);
    if (info.isDirectory()) {
      await mkdir(to, { recursive: true });
      await cp(from, to, { recursive: true });
    } else {
      await cp(from, to);
    }
    console.log(`published ${entry}`);
  }

  // Tells GitHub Pages to serve the directory verbatim instead of running it
  // through Jekyll (which would otherwise skip files/folders beginning with an
  // underscore and can rewrite output unpredictably).
  await writeFile(path.join(ROOT, ".nojekyll"), "");
  console.log("published .nojekyll");
  console.log("Root publish complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
