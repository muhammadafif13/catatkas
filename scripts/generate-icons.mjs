import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const logoSvg = await readFile(path.join(root, 'public', 'logo.svg'));
const iconsDir = path.join(root, 'public', 'icons');

await mkdir(iconsDir, { recursive: true });

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

await Promise.all(
  sizes.map((size) =>
    sharp(logoSvg)
      .resize(size, size)
      .png()
      .toFile(path.join(iconsDir, `icon-${size}x${size}.png`)),
  ),
);

await sharp(logoSvg)
  .resize(512, 512)
  .png()
  .toFile(path.join(iconsDir, 'maskable-icon-512x512.png'));

await sharp(logoSvg).resize(180, 180).png().toFile(path.join(root, 'public', 'apple-touch-icon.png'));

await sharp(logoSvg).resize(32, 32).png().toFile(path.join(root, 'public', 'favicon-32x32.png'));

console.log(`Generated ${sizes.length + 3} PWA icons.`);
