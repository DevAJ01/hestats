interface RiskBadgeProps {
  risk: 'Low' | 'Medium' | 'High'
  size?: 'sm' | 'md'
}

const colorMap = {
  Low: { fg: 'var(--positive)', bg: 'var(--positive-bg)' },
  Medium: { fg: 'var(--warning)', bg: 'var(--warning-bg)' },
  High: { fg: 'var(--negative)', bg: 'var(--negative-bg)' },
}

export function RiskBadge({ risk, size = 'md' }: RiskBadgeProps) {
  const c = colorMap[risk]
  return (
    <span
      className="inline-flex items-center gap-1"
      style={{
        color: c.fg,
        backgroundColor: c.bg,
        padding: size === 'sm' ? '1px 6px' : '2px 7px',
        fontSize: size === 'sm' ? 10 : 10.5,
        fontWeight: 500,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        borderRadius: 2,
        lineHeight: 1.4,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{ backgroundColor: c.fg, width: 5, height: 5 }}
      />
      {risk}
    </span>
  )
}
