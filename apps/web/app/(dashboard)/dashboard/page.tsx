import { getServerSession, apiRequest } from '../../../lib/auth'
import { KpiCard } from '../../../components/KpiCard'
import { CostPerKmChart } from '../../../components/charts/CostPerKmChart'
import { TopBar } from '../../../components/TopBar'

interface KpiSnapshot {
  id: string
  snapshotDate: string
  costPerKm: number
  kmPerLiter: number
  mechanicalAvailability: number
  mttrHours: number
  speedingEvents: number
}

interface FleetSummary {
  summaryDate: string
  totalKm: number
  totalFuelCost: number
  totalMaintCost: number
  avgCostPerKm: number
}

function formatKpi(snapshots: KpiSnapshot[]) {
  if (!snapshots.length) return { avgCostPerKm: 0, avgKmPerLiter: 0, avgAvailability: 0, avgMttr: 0 }
  const n = snapshots.length
  return {
    avgCostPerKm: snapshots.reduce((s, k) => s + Number(k.costPerKm), 0) / n,
    avgKmPerLiter: snapshots.reduce((s, k) => s + Number(k.kmPerLiter), 0) / n,
    avgAvailability: snapshots.reduce((s, k) => s + Number(k.mechanicalAvailability), 0) / n,
    avgMttr: snapshots.reduce((s, k) => s + Number(k.mttrHours), 0) / n,
  }
}

export default async function DashboardPage() {
  const session = await getServerSession()
  if (!session) return null

  let snapshots: KpiSnapshot[] = []
  let summaries: FleetSummary[] = []

  try {
    ;[snapshots, summaries] = await Promise.all([
      apiRequest<KpiSnapshot[]>('/api/kpis/snapshots?days=56', session.accessToken),
      apiRequest<FleetSummary[]>('/api/kpis/fleet-summary', session.accessToken),
    ])
  } catch {
    // Return empty state if API unreachable
  }

  const kpis = formatKpi(snapshots)

  const chartData = summaries.slice(0, 8).reverse().map((s, i) => ({
    label: `S${i + 1}`,
    costPerKm: Number(s.avgCostPerKm),
  }))

  const totals = summaries[0] ?? { totalKm: 0, totalFuelCost: 0, totalMaintCost: 0 }

  return (
    <div className="flex-1 overflow-auto">
      <TopBar title="KPIs Gerenciales" />
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard title="Costo / km" value={kpis.avgCostPerKm.toFixed(4)} unit="S/./km" />
          <KpiCard title="Km / Litro" value={kpis.avgKmPerLiter.toFixed(2)} unit="km/L" />
          <KpiCard title="Disponibilidad" value={kpis.avgAvailability.toFixed(1)} unit="%" />
          <KpiCard title="MTTR" value={kpis.avgMttr.toFixed(1)} unit="hrs" />
        </div>

        <CostPerKmChart data={chartData} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-gray-700 font-semibold mb-4">Resumen de Flota</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-gray-500 text-sm">Total Km</p>
              <p className="text-xl font-bold text-gray-900">{Number(totals.totalKm).toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Combustible</p>
              <p className="text-xl font-bold text-gray-900">S/. {Number(totals.totalFuelCost).toLocaleString('es-PE')}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Mantenimiento</p>
              <p className="text-xl font-bold text-gray-900">S/. {Number(totals.totalMaintCost).toLocaleString('es-PE')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
