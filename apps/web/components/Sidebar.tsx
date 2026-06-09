'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'KPIs', icon: '📊' },
  { href: '/caja-chica', label: 'Caja Chica', icon: '💰' },
  { href: '/mantenimiento', label: 'Mantenimiento', icon: '🔧' },
  { href: '/vehiculos', label: 'Vehículos', icon: '🚗' },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <aside className="w-56 bg-blue-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-blue-800">
        <h1 className="text-white font-bold text-xl">FlotaOS</h1>
        <p className="text-blue-300 text-xs mt-1">YOFC Perú</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
              pathname === item.href
                ? 'bg-blue-700 text-white font-medium'
                : 'text-blue-200 hover:bg-blue-800 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <button
          onClick={handleLogout}
          className="w-full text-blue-300 hover:text-white text-sm py-2 text-left"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
