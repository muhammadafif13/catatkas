import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
const iconsDir = path.join(publicDir, 'icons');
const androidRes = path.join(root, 'android', 'app', 'src', 'main', 'res');

const faviconSvg = await readFile(path.join(publicDir, 'favicon.svg'), 'utf8');
const faviconBuffer = Buffer.from(faviconSvg);

const pwaSizes = [72, 96, 128, 144, 152, 192, 384, 512];

const androidDensities = [
  { name: 'mdpi', legacy: 48, foreground: 108 },
  { name: 'hdpi', legacy: 72, foreground: 162 },
  { name: 'xhdpi', legacy: 96, foreground: 216 },
  { name: 'xxhdpi', legacy: 144, foreground: 324 },
  { name: 'xxxhdpi', legacy: 192, foreground: 432 },
];

const splashSizes = [
  ['drawable', 480, 320],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
];

const roundedTilePattern = /<rect width="512" height="512" rx="112" fill="url\(#bg\)" \/>/;

if (!roundedTilePattern.test(faviconSvg)) {
  throw new Error('favicon.svg: expected the 512x512 rounded background rect');
}

// Full-bleed variant for maskable PWA / Apple touch icons (the OS applies its own mask).
const fullBleedSvg = faviconSvg.replace(
  roundedTilePattern,
  '<rect width="512" height="512" fill="url(#bg)" />',
);

// Circular variant for legacy round launcher icons.
const roundSvg = faviconSvg.replace(
  roundedTilePattern,
  '<circle cx="256" cy="256" r="256" fill="url(#bg)" />',
);

// Transparent mark for Android adaptive foregrounds and the Android 12 splash icon.
// The art is scaled to the 108dp adaptive canvas and centred on its visual bounds.
const artMarkup = faviconSvg
  .replace(roundedTilePattern, '')
  .replace(/^[\s\S]*?<svg[^>]*>/, '')
  .replace(/<\/svg>\s*$/, '');

const foregroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">
  <g transform="translate(-5.54 3.27) scale(0.2025)">${artMarkup}</g>
</svg>`;

async function renderIcon(svg, size, file) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);
}

async function renderSplash(width, height, file) {
  const markSize = Math.max(64, Math.round(Math.min(width, height) * 0.3));
  const mark = await sharp(faviconBuffer).resize(markSize, markSize).png().toBuffer();
  const glow = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
       <defs>
         <radialGradient id="glow" cx="50%" cy="45%" r="58%">
           <stop offset="0%" stop-color="#6366f1" stop-opacity="0.3" />
           <stop offset="55%" stop-color="#6366f1" stop-opacity="0.08" />
           <stop offset="100%" stop-color="#0f172a" stop-opacity="0" />
         </radialGradient>
       </defs>
       <rect width="100%" height="100%" fill="url(#glow)" />
     </svg>`,
  );

  await sharp({
    create: { width, height, channels: 4, background: '#0f172a' },
  })
    .composite([
      { input: glow, top: 0, left: 0 },
      { input: mark, gravity: 'center' },
    ])
    .png()
    .toFile(file);
}

await mkdir(iconsDir, { recursive: true });

// PWA / browser icons.
await Promise.all(
  pwaSizes.map((size) => renderIcon(faviconSvg, size, path.join(iconsDir, `icon-${size}x${size}.png`))),
);
await renderIcon(fullBleedSvg, 512, path.join(iconsDir, 'maskable-icon-512x512.png'));
await renderIcon(fullBleedSvg, 180, path.join(publicDir, 'apple-touch-icon.png'));
await renderIcon(faviconSvg, 32, path.join(publicDir, 'favicon-32x32.png'));

// Android launcher icons (legacy, round, and adaptive foreground).
for (const density of androidDensities) {
  const dir = path.join(androidRes, `mipmap-${density.name}`);
  await Promise.all([
    renderIcon(faviconSvg, density.legacy, path.join(dir, 'ic_launcher.png')),
    renderIcon(roundSvg, density.legacy, path.join(dir, 'ic_launcher_round.png')),
    renderIcon(foregroundSvg, density.foreground, path.join(dir, 'ic_launcher_foreground.png')),
  ]);
}

// Android 12+ system splash icon (transparent mark, platform applies the mask).
await renderIcon(foregroundSvg, 512, path.join(androidRes, 'drawable', 'splash_icon.png'));

// Branded native splash screens for every density and orientation.
for (const [folder, width, height] of splashSizes) {
  await renderSplash(width, height, path.join(androidRes, folder, 'splash.png'));
}

console.log(
  `Generated ${pwaSizes.length + 3} PWA icons, ${androidDensities.length * 3} Android icons, ` +
    `and ${splashSizes.length + 1} splash assets.`,
);
