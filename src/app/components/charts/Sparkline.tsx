interface SparklineProps {
  values: (number | null | undefined)[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}

export function Sparkline({ values, width = 60, height = 18, color, fill = false }: SparklineProps) {
  const knownValues = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
  if (!knownValues.length) return null

  const min = Math.min(...knownValues)
  const max = Math.max(...knownValues)
  const range = max - min || 1
  const stepX = knownValues.length > 1 ? width / (knownValues.length - 1) : 0

  const points = knownValues.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return [x, y] as const
  })

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  const trendUp = knownValues[knownValues.length - 1] >= knownValues[0]
  const strokeColor = color ?? (trendUp ? '#5fa97b' : '#cf6660')

  const areaPath = `${path} L${width},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {fill && <path d={areaPath} fill={strokeColor} opacity={0.12} />}
      <path
        d={path}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.25}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  )
}
