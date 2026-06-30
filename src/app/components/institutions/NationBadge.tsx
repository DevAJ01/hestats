import { Institution } from '../../data/types'

interface NationBadgeProps {
  nation: Institution['nation']
  size?: 'sm' | 'md'
}

const codeMap: Record<Institution['nation'], string> = {
  England: 'ENG',
  Scotland: 'SCT',
  Wales: 'WLS',
  'Northern Ireland': 'NIR',
}

export function NationBadge({ nation, size = 'md' }: NationBadgeProps) {
  return (
    <span
      style={{
        color: 'var(--text-2)',
        backgroundColor: 'var(--bg)',
        padding: size === 'sm' ? '1px 5px' : '2px 6px',
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.06em',
        borderRadius: 2,
        border: '1px solid var(--border)',
        fontFamily: "'JetBrains Mono', monospace",
        lineHeight: 1.4,
        display: 'inline-block',
      }}
    >
      {codeMap[nation]}
    </span>
  )
}
