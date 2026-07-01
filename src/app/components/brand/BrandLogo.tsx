export type LogoTone = 'onDark' | 'onLight'

interface BrandMarkProps {
  size?: number
  tone?: LogoTone
}

interface BrandLogoProps extends BrandMarkProps {
  variant?: 'mark' | 'wordmark' | 'lockup' | 'stacked'
  showTag?: boolean
}

const INK = '#f5f5f4'
const BLACK = '#0a0a0a'
const DISPLAY = "'Archivo', 'Inter', system-ui, sans-serif"
const MONO = "'IBM Plex Mono', 'JetBrains Mono', monospace"

function colorFor(tone: LogoTone) {
  return tone === 'onDark' ? INK : BLACK
}

export function BrandMark({ size = 24, tone = 'onDark' }: BrandMarkProps) {
  const color = colorFor(tone)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="HEStats mark"
      role="img"
    >
      <rect x="14" y="13" width="9.5" height="38" fill={color} />
      <rect x="40.5" y="13" width="9.5" height="38" fill={color} />
      <path d="M23.5 36 L40.5 26 L40.5 34.5 L23.5 44.5 Z" fill={color} />
    </svg>
  )
}

function Wordmark({ tone, size, showTag = true }: { tone: LogoTone; size: number; showTag?: boolean }) {
  const color = colorFor(tone)
  const muted = tone === 'onDark' ? '#a8a8a2' : '#6b6b66'

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', lineHeight: 1 }}>
      <span
        style={{
          color,
          fontFamily: DISPLAY,
          fontWeight: 800,
          fontSize: size,
          letterSpacing: '0.01em',
          textTransform: 'uppercase',
        }}
      >
        HEstats
      </span>
      {showTag && (
        <span
          style={{
            color: muted,
            fontFamily: MONO,
            fontSize: Math.max(8, size * 0.31),
            letterSpacing: '0.16em',
            marginTop: Math.max(3, size * 0.18),
            textTransform: 'uppercase',
          }}
        >
          Higher Education Intelligence
        </span>
      )}
    </span>
  )
}

export function BrandLogo({
  variant = 'lockup',
  tone = 'onDark',
  size = 18,
  showTag = true,
}: BrandLogoProps) {
  if (variant === 'mark') return <BrandMark size={size} tone={tone} />

  if (variant === 'wordmark') {
    return <Wordmark tone={tone} size={size} showTag={showTag} />
  }

  if (variant === 'stacked') {
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: size * 0.55 }}>
        <BrandMark size={size * 2.4} tone={tone} />
        <Wordmark tone={tone} size={size} showTag={showTag} />
      </span>
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.55 }}>
      <BrandMark size={size * 1.45} tone={tone} />
      <Wordmark tone={tone} size={size} showTag={showTag} />
    </span>
  )
}
