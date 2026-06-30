import { getGradeColor, getGradeBg } from '../../data/health'

interface HealthBadgeProps {
  score: number
  grade: string
  size?: 'sm' | 'md' | 'lg'
  showScore?: boolean
}

export function HealthBadge({ score, grade, size = 'md', showScore = false }: HealthBadgeProps) {
  const color = getGradeColor(grade)
  const bg = getGradeBg(grade)

  const fontSize = size === 'lg' ? 13 : size === 'sm' ? 9.5 : 11
  const padding = size === 'lg' ? '3px 9px' : size === 'sm' ? '1px 5px' : '2px 7px'

  return (
    <span
      className="inline-flex items-center gap-1 font-num tabular-nums"
      style={{
        color,
        backgroundColor: bg,
        padding,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.06em',
        borderRadius: 2,
        lineHeight: 1.4,
        border: `1px solid ${color}40`,
      }}
      title={`Financial Health Score: ${score}/100`}
    >
      {grade}
      {showScore && (
        <span style={{ fontWeight: 400, opacity: 0.75, fontSize: fontSize - 1 }}>
          {score}
        </span>
      )}
    </span>
  )
}
