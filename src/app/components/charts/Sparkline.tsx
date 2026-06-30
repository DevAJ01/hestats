interface SparklineProps {
  values: number[]
  width?: number
  height?: number
  color?: string
  fill?: boolean
}

export function Sparkline({ values, width = 60, height = 18, color, fill = false }: SparklineProps) {
  if (!values.length) return null

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const stepX = values.length > 1 ? width / (values.length - 1) : 0

  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - ((v - min) / range) * height
    return [x, y] as const
  })

  const path = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

  const trendUp = values[values.length - 1] >= values[0]
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
