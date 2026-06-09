interface KpiCardProps {
  title: string
  value: string | number
  unit: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export function KpiCard({ title, value, unit, trend, trendValue }: KpiCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'
  const trendArrow = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <p className="text-gray-500 text-sm font-medium">{title}</p>
      <div className="flex items-end gap-2 mt-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-gray-500 text-sm mb-1">{unit}</span>
      </div>
      {trendValue && (
        <p className={`text-xs mt-2 ${trendColor}`}>
          {trendArrow} {trendValue} vs. semana anterior
        </p>
      )}
    </div>
  )
}
