export interface BrandFormat {
  key: string
  label: string
  platform: string
  w: number
  h: number
}

export const BRAND_FORMATS: BrandFormat[] = [
  { key: 'profile-square', label: 'Profile Square', platform: 'Avatar · app icon', w: 1080, h: 1080 },
  { key: 'open-graph', label: 'Open Graph', platform: 'Website preview', w: 1200, h: 630 },
  { key: 'x-header', label: 'X Header', platform: 'X / Twitter banner', w: 1500, h: 500 },
  { key: 'linkedin-cover', label: 'LinkedIn Cover', platform: 'Company page', w: 1128, h: 191 },
  { key: 'youtube-cover', label: 'YouTube Cover', platform: 'Channel art safe area', w: 2560, h: 1440 },
  { key: 'instagram-square', label: 'Instagram Square', platform: 'Feed post', w: 1080, h: 1080 },
  { key: 'instagram-story', label: 'Instagram Story', platform: 'Story / reel cover', w: 1080, h: 1920 },
]

const BLACK = '#0a0a0a'
const INK = '#f5f5f4'
const GRAPHITE = '#2a2a28'
const STEEL = '#6b6b66'
const ASH = '#a8a8a2'
const DISPLAY = 'Archivo, Inter, system-ui, sans-serif'
const MONO = 'IBM Plex Mono, JetBrains Mono, monospace'

function Mark({ x, y, size, color = INK }: { x: number; y: number; size: number; color?: string }) {
  const s = size / 64
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="14" y="13" width="9.5" height="38" fill={color} />
      <rect x="40.5" y="13" width="9.5" height="38" fill={color} />
      <path d="M23.5 36 L40.5 26 L40.5 34.5 L23.5 44.5 Z" fill={color} />
    </g>
  )
}

export function BrandBanner({ format }: { format: BrandFormat }) {
  const { w, h, key } = format
  const short = h < 280
  const square = w === h
  const story = h > w
  const pad = Math.max(36, Math.min(w, h) * (short ? 0.12 : 0.075))
  const markSize = square ? w * 0.24 : story ? w * 0.2 : Math.min(w, h) * 0.22
  const wordSize = square ? w * 0.105 : story ? w * 0.092 : Math.min(w, h) * 0.14
  const headlineSize = square ? w * 0.048 : story ? w * 0.053 : Math.min(w, h) * 0.062

  const centerX = w / 2
  const centerY = h / 2
  const grid = Math.max(32, Math.min(w, h) / 14)
  const isProfile = key === 'profile-square'

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width={w} height={h} fill={BLACK} />
      <defs>
        <pattern id={`brand-grid-${key}`} width={grid} height={grid} patternUnits="userSpaceOnUse">
          <path d={`M ${grid} 0 L 0 0 0 ${grid}`} fill="none" stroke={GRAPHITE} strokeWidth="1" opacity="0.46" />
        </pattern>
      </defs>
      <rect width={w} height={h} fill={`url(#brand-grid-${key})`} opacity="0.55" />
      <line x1={pad} y1={pad} x2={w - pad} y2={pad} stroke={GRAPHITE} strokeWidth="1" />
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke={GRAPHITE} strokeWidth="1" />

      {isProfile ? (
        <>
          <Mark x={centerX - markSize / 2} y={centerY - markSize / 2 - w * 0.035} size={markSize} />
          <text
            x={centerX}
            y={centerY + markSize * 0.66}
            fill={INK}
            fontFamily={DISPLAY}
            fontWeight="800"
            fontSize={wordSize}
            textAnchor="middle"
            letterSpacing="0.01em"
          >
            HEstats
          </text>
        </>
      ) : (
        <>
          <g transform={`translate(${pad} ${pad * 0.86})`}>
            <Mark x={0} y={0} size={short ? h * 0.24 : Math.min(72, Math.max(40, markSize * 0.34))} />
            <text
              x={short ? h * 0.3 : Math.min(92, Math.max(54, markSize * 0.45))}
              y={short ? h * 0.145 : Math.min(42, Math.max(30, markSize * 0.22))}
              fill={INK}
              fontFamily={DISPLAY}
              fontWeight="800"
              fontSize={short ? h * 0.12 : Math.max(38, wordSize)}
              letterSpacing="0.01em"
            >
              HEstats
            </text>
          </g>
          <text
            x={story ? pad : w - pad}
            y={story ? centerY + markSize * 0.68 : centerY + headlineSize * 0.15}
            fill={INK}
            fontFamily={DISPLAY}
            fontWeight="800"
            fontSize={headlineSize}
            textAnchor={story ? 'start' : 'end'}
            letterSpacing="0"
          >
            Higher Education Intelligence
          </text>
          {!short && (
            <text
              x={story ? pad : w - pad}
              y={story ? centerY + markSize * 0.68 + headlineSize * 1.08 : centerY + headlineSize * 1.05}
              fill={ASH}
              fontFamily={MONO}
              fontSize={Math.max(18, headlineSize * 0.33)}
              textAnchor={story ? 'start' : 'end'}
              letterSpacing="0.12em"
            >
              UK FINANCE · OUTCOMES · SECTOR SIGNALS
            </text>
          )}
          {story && <Mark x={centerX - markSize / 2} y={centerY - markSize * 0.74} size={markSize} />}
        </>
      )}

      <text
        x={pad}
        y={h - pad * 0.45}
        fill={STEEL}
        fontFamily={MONO}
        fontSize={Math.max(12, Math.min(w, h) * 0.018)}
        letterSpacing="0.14em"
      >
        HESTATS.CO.UK
      </text>
      <text
        x={w - pad}
        y={h - pad * 0.45}
        fill={STEEL}
        fontFamily={MONO}
        fontSize={Math.max(12, Math.min(w, h) * 0.018)}
        textAnchor="end"
        letterSpacing="0.14em"
      >
        {w}x{h}
      </text>
    </svg>
  )
}
