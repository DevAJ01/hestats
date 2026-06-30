import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'

interface SurplusBarChartProps {
  data: {
    name: string
    revenue: number
    surplus: number
    color: string
  }[]
  height?: number
}

const TOOLTIP_STYLE = {
  fontSize: 11,
  backgroundColor: '#171b21',
  border: '1px solid #3a414d',
  borderRadius: 3,
  padding: '6px 8px',
}

export function SurplusBarChart({ data, height = 240 }: SurplusBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="#2b313b" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: '#707987' }}
          axisLine={{ stroke: '#2b313b' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 10, fill: '#707987' }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v) => `£${v}m`}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: '#20262f' }}
          formatter={(value: number, name: string) => [`£${value.toLocaleString()}m`, name]}
          labelStyle={{ color: '#a0a9b7', fontSize: 10, marginBottom: 2 }}
          itemStyle={{ color: '#f3f5f7' }}
        />
        <Legend wrapperStyle={{ fontSize: 10.5, color: '#a0a9b7' }} iconType="square" iconSize={10} />
        <Bar dataKey="revenue" name="Total Income" maxBarSize={42}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} opacity={0.55} />
          ))}
        </Bar>
        <Bar dataKey="surplus" name="Surplus" maxBarSize={42}>
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
