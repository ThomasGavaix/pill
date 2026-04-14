// Pill + check icon — matches the PWA home screen icon
export default function AppIcon({ size = 36 }) {
  const r = size * 0.22
  const cx = size / 2

  const pillW = size * 0.56
  const pillH = size * 0.24
  const pillX = cx - pillW / 2
  const pillY = size * 0.26
  const pillR = pillH / 2

  const badgeR = size * 0.19
  const badgeCx = size * 0.67
  const badgeCy = size * 0.67

  const ck1x = badgeCx - badgeR * 0.42
  const ck1y = badgeCy + badgeR * 0.05
  const ck2x = badgeCx - badgeR * 0.10
  const ck2y = badgeCy + badgeR * 0.42
  const ck3x = badgeCx + badgeR * 0.46
  const ck3y = badgeCy - badgeR * 0.32

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="appicon-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <clipPath id="appicon-rh">
          <rect x={cx} y={pillY} width={pillW} height={pillH} />
        </clipPath>
      </defs>

      {/* Background */}
      <rect width={size} height={size} rx={r} ry={r} fill="url(#appicon-bg)" />

      {/* Pill body */}
      <rect x={pillX} y={pillY} width={pillW} height={pillH} rx={pillR} ry={pillR} fill="white" opacity={0.95} />

      {/* Right half tint */}
      <rect x={pillX} y={pillY} width={pillW} height={pillH} rx={pillR} ry={pillR} fill="#93c5fd" opacity={0.65} clipPath="url(#appicon-rh)" />

      {/* Divider */}
      <line x1={cx} y1={pillY + size * 0.025} x2={cx} y2={pillY + pillH - size * 0.025}
        stroke="#3b82f6" strokeWidth={size * 0.022} strokeLinecap="round" />

      {/* Check badge */}
      <circle cx={badgeCx} cy={badgeCy} r={badgeR} fill="#22c55e" />
      <polyline
        points={`${ck1x},${ck1y} ${ck2x},${ck2y} ${ck3x},${ck3y}`}
        fill="none" stroke="white" strokeWidth={size * 0.055} strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}
