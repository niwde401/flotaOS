'use client'

import { useState, useEffect } from 'react'

interface Transaction {
  id: string
  transactionDate: string
  concept: string
  description: string | null
  amount: number
  status: string
  staff: { fullName: string }
  region: { name: string }
  photoUrl: string | null
}

const STATUS_COLORS: Record<string, string> = {
  pendiente: 'bg-yellow-100 text-yellow-800',
  rendido: 'bg-green-100 text-green-800',
  observado: 'bg-red-100 text-red-800',
  en_reembolso: 'bg-purple-100 text-purple-800',
  depositado: 'bg-blue-100 text-blue-800',
}

interface Props {
  regionId?: string
}

export function TransactionTable({ regionId }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page) })
    if (regionId) params.set('regionId', regionId)
    if (statusFilter) params.set('status', statusFilter)

    fetch(`/api/proxy/petty-cash/transactions?${params}`)
      .then((r) => r.json())
      .then((json) => {
        setTransactions(json.data || [])
        setTotal(json.meta?.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [regionId, statusFilter, page])

  const pageSize = 50
  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-gray-700 font-semibold">Transacciones</h3>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5"
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="rendido">Rendido</option>
            <option value="observado">Observado</option>
            <option value="en_reembolso">En reembolso</option>
            <option value="depositado">Depositado</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-gray-400">Cargando...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {[
                  'Fecha',
                  'Técnico',
                  'Región',
                  'Concepto',
                  'Monto',
                  'Estado',
                  'Comprobante',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(t.transactionDate).toLocaleDateString('es-PE')}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {t.staff?.fullName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{t.region?.name}</td>
                  <td className="px-4 py-3 text-gray-700 capitalize">
                    {t.concept?.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    S/. {Number(t.amount).toLocaleString('es-PE', {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[t.status] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {t.photoUrl ? (
                      <a
                        href={t.photoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-xs"
                      >
                        Ver
                      </a>
                    ) : (
                      <span className="text-red-500 text-xs">Sin foto</span>
                    )}
                  </td>
                </tr>
              ))}
              {!transactions.length && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Sin transacciones
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
          <span>
            Mostrando{' '}
            {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)}{' '}
            de {total}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1 border rounded disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
