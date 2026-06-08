'use client'

import { useState, useEffect } from 'react'

interface OT {
  id: string
  numeroOt: string
  fechaProgramada: string
  status: string
  urgencia: string
  diagnostico: string | null
  vehiculo: { plateNumber: string; brand: string }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-700',
  en_taller: 'bg-yellow-100 text-yellow-800',
  completada: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

const URGENCY_COLORS: Record<string, string> = {
  normal: 'text-gray-600',
  urgent: 'text-yellow-600 font-semibold',
  critical: 'text-red-600 font-bold',
}

export function OTTable() {
  const [orders, setOrders] = useState<OT[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    const params = statusFilter ? `?status=${statusFilter}` : ''
    fetch(`/api/proxy/maintenance/orders${params}`)
      .then((r) => r.json())
      .then((j) => setOrders(j.data || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-gray-700 font-semibold">Órdenes de Trabajo</h3>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
        >
          <option value="">Todos</option>
          <option value="pending">Pendiente</option>
          <option value="en_taller">En Taller</option>
          <option value="completada">Completada</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['N° OT', 'Vehículo', 'Diagnóstico', 'Fecha', 'Estado', 'Urgencia'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((ot) => (
                <tr key={ot.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-700">{ot.numeroOt}</td>
                  <td className="px-4 py-3 font-medium">{ot.vehiculo.brand} {ot.vehiculo.plateNumber}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{ot.diagnostico || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(ot.fechaProgramada).toLocaleDateString('es-PE')}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[ot.status] || 'bg-gray-100'}`}>{ot.status}</span>
                  </td>
                  <td className={`px-4 py-3 ${URGENCY_COLORS[ot.urgencia] || ''}`}>{ot.urgencia}</td>
                </tr>
              ))}
              {!orders.length && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Sin órdenes de trabajo</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
