import { getServerSession, apiRequest } from '../../../lib/auth'
import { TopBar } from '../../../components/TopBar'

interface Vehicle {
  id: string
  plateNumber: string
  brand: string
  model: string
  year: number
  vehicleType: string
  status: string
  fuelType: string
  currentKm: number
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-700',
  in_maintenance: 'bg-yellow-100 text-yellow-800',
  out_of_service: 'bg-red-100 text-red-800',
}

export default async function VehiculosPage() {
  const session = await getServerSession()
  if (!session) return null

  let vehicles: Vehicle[] = []
  try {
    vehicles = await apiRequest<Vehicle[]>('/api/vehicles', session.accessToken)
  } catch {}

  const activeCount = vehicles.filter((v) => v.status === 'active').length
  const inMaintenanceCount = vehicles.filter((v) => v.status === 'in_maintenance').length

  return (
    <div className="flex-1 overflow-auto">
      <TopBar title="Vehículos" />
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-gray-500 text-sm">Total Vehículos</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{vehicles.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-gray-500 text-sm">Activos</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{activeCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-5">
            <p className="text-gray-500 text-sm">En Mantenimiento</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{inMaintenanceCount}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Placa', 'Vehículo', 'Año', 'Tipo', 'Combustible', 'Km Actual', 'Estado'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-900">{v.plateNumber}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{v.brand} {v.model}</td>
                    <td className="px-4 py-3 text-gray-600">{v.year}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{v.vehicleType}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{v.fuelType}</td>
                    <td className="px-4 py-3 text-gray-700">{v.currentKm.toLocaleString('es-PE')} km</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[v.status] || 'bg-gray-100'}`}>
                        {v.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
                {!vehicles.length && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Sin vehículos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
