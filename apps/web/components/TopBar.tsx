import { getServerSession } from '../lib/auth'

export async function TopBar({ title }: { title: string }) {
  const session = await getServerSession()
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <h2 className="text-gray-800 font-semibold text-lg">{title}</h2>
      <div className="text-sm text-gray-500">
        {session?.user.fullName} · <span className="text-blue-700">{session?.user.role}</span>
      </div>
    </header>
  )
}
