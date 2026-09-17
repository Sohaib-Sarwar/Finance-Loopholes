// One-off asset pipeline: generates every PWA/browser icon plus the in-app
// brand mark from the project's single source logo (src-assets/logo.png).
// Run with `npm run icons`. Output is committed so the build itself has no
// image-processing dependency (sharp stays a devDependency).
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE = path.join(ROOT, "src-assets", "logo.png");
const ICON_DIR = path.join(ROOT, "app", "public", "icons");
const ASSET_DIR = path.join(ROOT, "app", "src", "assets");

// Palette quantisation keeps these an order of magnitude smaller than plain
// RGBA PNGs. The source art is flat-shaded, so the visual difference is nil
// while the offline precache drops by roughly half a megabyte.
const PNG_OPTS = { compressionLevel: 9, palette: true, quality: 92, effort: 10 };

const PLAIN = [
  { dir: ICON_DIR, name: "icon-192.png", size: 192 },
  { dir: ICON_DIR, name: "icon-512.png", size: 512 },
  { dir: ICON_DIR, name: "apple-touch-icon-180.png", size: 180 },
  { dir: ICON_DIR, name: "favicon-32.png", size: 32 },
  { dir: ICON_DIR, name: "favicon-16.png", size: 16 },
  // Brand mark used inside the UI (header, install sheet).
  { dir: ASSET_DIR, name: "logo.png", size: 128 },
];

// Maskable icons must keep meaningful content inside the centre safe zone (a
// circle covering 80% of the icon), so the logo is padded onto a white square
// at 80% scale and never cropped by an adaptive-icon mask.
const MASKABLE = [
  { name: "icon-192-maskable.png", size: 192 },
  { name: "icon-512-maskable.png", size: 512 },
];

async function main() {
  await mkdir(ICON_DIR, { recursive: true });
  await mkdir(ASSET_DIR, { recursive: true });

  for (const { dir, name, size } of PLAIN) {
    const info = await sharp(SOURCE)
      .resize(size, size, { fit: "cover" })
      .png(PNG_OPTS)
      .toFile(path.join(dir, name));
    console.log(
      `generated ${name} (${size}x${size}, ${(info.size / 1024).toFixed(1)} kB)`,
    );
  }

  for (const { name, size } of MASKABLE) {
    const contentSize = Math.round(size * 0.8);
    const padding = Math.round((size - contentSize) / 2);
    const content = await sharp(SOURCE)
      .resize(contentSize, contentSize, { fit: "cover" })
      .toBuffer();

    const info = await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([{ input: content, left: padding, top: padding }])
      .png(PNG_OPTS)
      .toFile(path.join(ICON_DIR, name));
    console.log(
      `generated ${name} (${size}x${size} maskable, ${(info.size / 1024).toFixed(1)} kB)`,
    );
  }

  console.log("Icon generation complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
