import Link from 'next/link'
import { Users, Clock, Receipt, DollarSign, UserCog } from 'lucide-react'
import LogoutButton from '@/app/components/LogoutButton'

const navItems = [
  { href: '/boss/today', label: 'Today', icon: Clock },
  { href: '/boss/attendance', label: 'Attendance', icon: Users },
  { href: '/boss/claims', label: 'Claims', icon: Receipt },
  { href: '/boss/payroll', label: 'Payroll', icon: DollarSign },
  { href: '/boss/drivers', label: 'Drivers', icon: UserCog },
]

export default function BossLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col min-h-screen hidden md:flex">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">DP</span>
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Driver Payroll</p>
              <p className="text-xs text-gray-400">Boss Dashboard</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-blue-600 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <LogoutButton className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-red-600 transition-colors w-full" />
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="flex-1 flex flex-col">
        <nav className="md:hidden bg-white border-b border-gray-100 flex justify-around py-2">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 px-2 py-1 text-gray-500 hover:text-blue-600 text-xs">
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
