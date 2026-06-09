interface Account {
  regionId: string
  regionName: string
  permanentFund: number
  currentBalance: number
  amountInField: number
  toBeSubmitted: number
  inReimbursement: number
  gap: number
}

interface Props {
  accounts: Account[]
}

const PALETTE = ['#1e40af', '#16a34a', '#d97706', '#7c3aed', '#0891b2']

export function PettyCashBalance({ accounts }: Props) {
  if (!accounts.length) {
    return (
      <div className="bg-white rounded-xl p-6 text-gray-400 text-center">
        Sin datos de caja chica
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-gray-700 font-semibold mb-6">Balance por Región</h3>
      <div className="space-y-5">
        {accounts.map((acc, i) => {
          const color = PALETTE[i % PALETTE.length]
          const usedPct =
            acc.permanentFund > 0
              ? Math.min(
                  100,
                  ((acc.permanentFund - acc.currentBalance) / acc.permanentFund) *
                    100
                )
              : 0
          return (
            <div key={acc.regionId}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-800">{acc.regionName}</span>
                <span className="text-gray-500">
                  S/. {Number(acc.currentBalance).toLocaleString('es-PE')} / S/. {Number(acc.permanentFund).toLocaleString('es-PE')}
                </span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${usedPct}%`,
                    backgroundColor: color,
                  }}
                  className="h-full rounded-full transition-all"
                />
              </div>
              <div className="flex gap-4 mt-1 text-xs text-gray-500">
                <span>
                  En campo: S/. {Number(acc.amountInField).toLocaleString('es-PE')}
                </span>
                <span>
                  Por rendir: S/. {Number(acc.toBeSubmitted).toLocaleString('es-PE')}
                </span>
                <span
                  className={
                    Number(acc.gap) > 0 ? 'text-red-600 font-medium' : ''
                  }
                >
                  Brecha: S/. {Number(acc.gap).toLocaleString('es-PE')}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
