// Pill + clock icon — matches the PWA home screen icon
export default function AppIcon({ size = 36 }) {
  const r = size * 0.22
  const cx = size / 2

  const pillW = size * 0.56
  const pillH = size * 0.24
  const pillX = cx - pillW / 2
  const pillY = size * 0.26
  const pillR = pillH / 2

  const clockR = size * 0.19
  const clockCx = size * 0.67
  const clockCy = size * 0.67

  const handLen12 = clockR * 0.52
  const handLen3  = clockR * 0.42

  const sin = Math.sin(-Math.PI * 2 / 3)
  const cos = Math.cos(-Math.PI * 2 / 3)

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

      {/* Clock face */}
      <circle cx={clockCx} cy={clockCy} r={clockR} fill="#1d4ed8" opacity={0.85} />
      <circle cx={clockCx} cy={clockCy} r={clockR} fill="none" stroke="white" strokeWidth={size * 0.018} opacity={0.9} />

      {/* Hour hand (~10 o'clock) */}
      <line
        x1={clockCx} y1={clockCy}
        x2={clockCx + handLen12 * sin} y2={clockCy - handLen12 * cos}
        stroke="white" strokeWidth={size * 0.03} strokeLinecap="round" opacity={0.95}
      />

      {/* Minute hand (~12 o'clock) */}
      <line
        x1={clockCx} y1={clockCy}
        x2={clockCx} y2={clockCy - handLen3}
        stroke="white" strokeWidth={size * 0.022} strokeLinecap="round" opacity={0.95}
      />

      {/* Center dot */}
      <circle cx={clockCx} cy={clockCy} r={size * 0.022} fill="white" />
    </svg>
  )
}
