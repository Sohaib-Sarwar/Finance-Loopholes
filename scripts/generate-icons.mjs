// One-off asset pipeline: generates every PWA/browser icon size from the
// project's single source logo (src-assets/logo.png). Run with `npm run icons`.
// Output is committed to public/icons/ so the build has no runtime image
// processing dependency (sharp stays a devDependency only).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "src-assets", "logo.png");
const OUT_DIR = path.join(ROOT, "public", "icons");

const PLAIN_SIZES = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
  { name: "apple-touch-icon-180.png", size: 180 },
  { name: "favicon-32.png", size: 32 },
  { name: "favicon-16.png", size: 16 },
];

// Maskable icons must keep all meaningful content inside the center "safe
// zone" (a circle covering 80% of the icon). We pad the source logo onto a
// white square at 80% scale so Android/adaptive-icon masks never crop it.
const MASKABLE_SIZES = [
  { name: "icon-192-maskable.png", size: 192 },
  { name: "icon-512-maskable.png", size: 512 },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const { name, size } of PLAIN_SIZES) {
    await sharp(SOURCE)
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT_DIR, name));
    console.log(`generated ${name} (${size}x${size})`);
  }

  for (const { name, size } of MASKABLE_SIZES) {
    const contentSize = Math.round(size * 0.8);
    const padding = Math.round((size - contentSize) / 2);
    const content = await sharp(SOURCE)
      .resize(contentSize, contentSize, { fit: "cover" })
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: content, left: padding, top: padding }])
      .png({ compressionLevel: 9 })
      .toFile(path.join(OUT_DIR, name));
    console.log(`generated ${name} (${size}x${size}, maskable safe-zone)`);
  }

  console.log("Icon generation complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
