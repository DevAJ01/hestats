import { FinancialYear } from '../../data/types'

interface DataSourceBadgeProps {
  source: FinancialYear['data_source']
  size?: 'sm' | 'md'
}

const map = {
  verified: { label: 'VERIFIED', fg: 'var(--positive)', bg: 'var(--positive-bg)' },
  pending: { label: 'PENDING', fg: 'var(--muted)', bg: 'var(--bg)' },
}

export function DataSourceBadge({ source, size = 'md' }: DataSourceBadgeProps) {
  const c = map[source]
  return (
    <span
      style={{
        color: c.fg,
        backgroundColor: c.bg,
        padding: size === 'sm' ? '1px 5px' : '2px 6px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.06em',
        borderRadius: 2,
        lineHeight: 1.4,
        fontFamily: "'JetBrains Mono', monospace",
        display: 'inline-block',
      }}
      title={
        source === 'verified'
          ? 'Sourced from audited annual financial statements'
          : 'Awaiting data'
      }
    >
      {c.label}
    </span>
  )
}
