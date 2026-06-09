import { getServerSession, apiRequest } from '../../../lib/auth'
import { TopBar } from '../../../components/TopBar'
import { OTTable } from '../../../components/OTTable'

interface OT { id: string; status: string; urgencia: string }

export default async function MantenimientoPage() {
  const session = await getServerSession()
  if (!session) return null

  let allOrders: OT[] = []
  try {
    allOrders = await apiRequest<OT[]>('/api/maintenance/orders', session.accessToken)
  } catch {}

  const inTaller = allOrders.filter((o) => o.status === 'en_taller').length
  const critical = allOrders.filter((o) => o.urgencia === 'critical').length
  const pending = allOrders.filter((o) => o.status === 'pending').length

  return (
    <div className="flex-1 overflow-auto">
      <TopBar title="Mantenimiento" />
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-gray-500 text-sm">En Taller Ahora</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{inTaller}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-gray-500 text-sm">Críticos</p>
            <p className="text-3xl font-bold text-red-600 mt-1">{critical}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-gray-500 text-sm">Pendientes</p>
            <p className="text-3xl font-bold text-gray-700 mt-1">{pending}</p>
          </div>
        </div>

        <OTTable />
      </main>
    </div>
  )
}
