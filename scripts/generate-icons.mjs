import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// SVG icon design: blue rounded-square background, white pill capsule centered
function makeSvg(size) {
  const r = size * 0.22  // corner radius
  const cx = size / 2
  const cy = size / 2

  // Pill capsule: horizontal, centered
  const pillW = size * 0.58
  const pillH = size * 0.26
  const pillX = cx - pillW / 2
  const pillY = cy - pillH / 2
  const pillR = pillH / 2

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Pill capsule body (full white) -->
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillR}" ry="${pillR}" fill="white" opacity="0.95"/>

  <!-- Right half tint to show two-tone capsule -->
  <clipPath id="rightHalf">
    <rect x="${cx}" y="${pillY}" width="${pillW}" height="${pillH}"/>
  </clipPath>
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillR}" ry="${pillR}" fill="#93c5fd" opacity="0.65" clip-path="url(#rightHalf)"/>

  <!-- Pill divider line -->
  <line
    x1="${cx}" y1="${pillY + size * 0.03}"
    x2="${cx}" y2="${pillY + pillH - size * 0.03}"
    stroke="#3b82f6" stroke-width="${size * 0.025}" stroke-linecap="round"/>
</svg>`
}

async function generateIcon(size, filename) {
  const svg = makeSvg(size)
  const buf = Buffer.from(svg)
  await sharp(buf)
    .resize(size, size)
    .png()
    .toFile(resolve(__dirname, '..', 'public', 'icons', filename))
  console.log(`Generated ${filename} (${size}x${size})`)
}

await generateIcon(192, 'icon-192.png')
await generateIcon(512, 'icon-512.png')

// Apple touch icon (180x180, no transparency, same design)
await generateIcon(180, 'apple-touch-icon.png')

// Also create maskable icon (content within safe zone = 80% of size)
async function generateMaskable(size, filename) {
  const svg = makeSvg(size)
  // For maskable, the design already fills the full square with bg color — good
  const buf = Buffer.from(svg)
  await sharp(buf)
    .resize(size, size)
    .png()
    .toFile(resolve(__dirname, '..', 'public', 'icons', filename))
  console.log(`Generated ${filename} (${size}x${size}) [maskable]`)
}

await generateMaskable(512, 'icon-maskable-512.png')

console.log('All icons generated!')
