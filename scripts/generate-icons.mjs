import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// SVG icon design: blue rounded-square, pill capsule upper-center, green check badge lower-right
function makeSvg(size) {
  const r = size * 0.22
  const cx = size / 2

  // Pill capsule: horizontal, shifted slightly upward
  const pillW = size * 0.56
  const pillH = size * 0.24
  const pillX = cx - pillW / 2
  const pillY = size * 0.26
  const pillR = pillH / 2

  // Check badge: bottom-right
  const badgeR = size * 0.19
  const badgeCx = size * 0.67
  const badgeCy = size * 0.67

  // Checkmark points inside badge
  const ck1x = badgeCx - badgeR * 0.42
  const ck1y = badgeCy + badgeR * 0.05
  const ck2x = badgeCx - badgeR * 0.10
  const ck2y = badgeCy + badgeR * 0.42
  const ck3x = badgeCx + badgeR * 0.46
  const ck3y = badgeCy - badgeR * 0.32

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1d4ed8"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Pill capsule body -->
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillR}" ry="${pillR}" fill="white" opacity="0.95"/>

  <!-- Right half tint (two-tone) -->
  <clipPath id="rightHalf">
    <rect x="${cx}" y="${pillY}" width="${pillW}" height="${pillH}"/>
  </clipPath>
  <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="${pillR}" ry="${pillR}" fill="#93c5fd" opacity="0.65" clip-path="url(#rightHalf)"/>

  <!-- Pill divider line -->
  <line x1="${cx}" y1="${pillY + size * 0.025}" x2="${cx}" y2="${pillY + pillH - size * 0.025}"
    stroke="#3b82f6" stroke-width="${size * 0.022}" stroke-linecap="round"/>

  <!-- Check badge circle -->
  <circle cx="${badgeCx}" cy="${badgeCy}" r="${badgeR}" fill="#22c55e"/>

  <!-- Checkmark -->
  <polyline
    points="${ck1x},${ck1y} ${ck2x},${ck2y} ${ck3x},${ck3y}"
    fill="none" stroke="white" stroke-width="${size * 0.055}" stroke-linecap="round" stroke-linejoin="round"/>
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
await generateIcon(180, 'apple-touch-icon.png')

async function generateMaskable(size, filename) {
  const svg = makeSvg(size)
  const buf = Buffer.from(svg)
  await sharp(buf)
    .resize(size, size)
    .png()
    .toFile(resolve(__dirname, '..', 'public', 'icons', filename))
  console.log(`Generated ${filename} (${size}x${size}) [maskable]`)
}

await generateMaskable(512, 'icon-maskable-512.png')

console.log('All icons generated!')
