import { getServerSession, apiRequest } from '../../../lib/auth'
import { TopBar } from '../../../components/TopBar'
import { PettyCashBalance } from '../../../components/PettyCashBalance'
import { TransactionTable } from '../../../components/TransactionTable'

interface PettyCashAccount {
  regionId: string
  permanentFund: number
  currentBalance: number
  amountInField: number
  toBeSubmitted: number
  inReimbursement: number
  gap: number
  region: { name: string }
}

export default async function CajaChicaPage() {
  const session = await getServerSession()
  if (!session) return null

  let accounts: PettyCashAccount[] = []
  try {
    accounts = await apiRequest<PettyCashAccount[]>(
      '/api/petty-cash/accounts',
      session.accessToken
    )
  } catch {}

  const mapped = accounts.map((a) => ({
    regionId: a.regionId,
    regionName: a.region?.name || a.regionId,
    permanentFund: Number(a.permanentFund),
    currentBalance: Number(a.currentBalance),
    amountInField: Number(a.amountInField),
    toBeSubmitted: Number(a.toBeSubmitted),
    inReimbursement: Number(a.inReimbursement),
    gap: Number(a.gap),
  }))

  const totals = {
    permanentFund: mapped.reduce((s, a) => s + a.permanentFund, 0),
    currentBalance: mapped.reduce((s, a) => s + a.currentBalance, 0),
    toBeSubmitted: mapped.reduce((s, a) => s + a.toBeSubmitted, 0),
  }

  return (
    <div className="flex-1 overflow-auto">
      <TopBar title="Caja Chica Regional" />
      <main className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Fondo Permanente Total',
              value: totals.permanentFund,
            },
            { label: 'Balance Disponible', value: totals.currentBalance },
            { label: 'Por Rendir', value: totals.toBeSubmitted },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <p className="text-gray-500 text-sm">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                S/. {card.value.toLocaleString('es-PE', {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          ))}
        </div>

        <PettyCashBalance accounts={mapped} />

        <TransactionTable />
      </main>
    </div>
  )
}
