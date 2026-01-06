'use client'

import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type AllocationItem = {
  type: string
  value: number
  percentage: number
}

type YieldPoint = {
  day: number
  value: number
}

type PayoutEvent = {
  day: number
  label: string
}

interface PortfolioChartsProps {
  allocation: AllocationItem[]
  colors: string[]
  yieldCurve: YieldPoint[]
  payoutEvents: PayoutEvent[]
}

export default function PortfolioCharts({
  allocation,
  colors,
  yieldCurve,
  payoutEvents,
}: PortfolioChartsProps) {
  return (
    <>
      <div className="metric-card">
        <div className="metric-label mb-3">Allocation</div>
        <div className="flex items-center gap-4">
          <div className="w-24 h-24">
            <PieChart width={96} height={96}>
              <Pie
                data={allocation}
                dataKey="percentage"
                nameKey="type"
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={40}
                strokeWidth={0}
              >
                {allocation.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </div>
          <div className="flex-1 space-y-1.5">
            {allocation.map((item, index) => (
              <div
                key={item.type}
                className="flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors[index % colors.length] }}
                  />
                  <span className="text-slate-600">{item.type}</span>
                </div>
                <span className="font-medium">
                  {item.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-label mb-3">30D Yield Trend</div>
        <div className="flex items-center gap-3 text-xs text-slate-600 mb-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Realized</span>
          </div>
        </div>
        <div className="h-24">
          <ResponsiveContainer width="100%" height={96} minWidth={0}>
            <LineChart data={yieldCurve}>
              <XAxis dataKey="day" hide />
              <YAxis hide domain={['dataMin - 0.005', 'dataMax + 0.005']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number | undefined) => [
                  value ? `${(value * 100).toFixed(2)}%` : '0%',
                  'Realized',
                ]}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
              />
              {payoutEvents.map((event) => {
                const point = yieldCurve.find((item) => item.day === event.day)
                if (!point) return null
                return (
                  <ReferenceDot
                    key={`${event.label}-${event.day}`}
                    x={event.day}
                    y={point.value}
                    r={3}
                    fill="hsl(var(--primary))"
                    stroke="hsl(var(--card))"
                  />
                )
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  )
}
