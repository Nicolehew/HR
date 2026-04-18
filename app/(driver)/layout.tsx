import Link from 'next/link'
import { Home, Clock, FileText, Receipt, LogOut } from 'lucide-react'
import LogoutButton from '@/app/components/LogoutButton'

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-50">
        <Link href="/home" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-500 hover:text-blue-600">
          <Home className="w-5 h-5" />
          <span className="text-xs">Home</span>
        </Link>
        <Link href="/attendance" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-500 hover:text-blue-600">
          <Clock className="w-5 h-5" />
          <span className="text-xs">Clock In</span>
        </Link>
        <Link href="/claims/new" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-500 hover:text-blue-600">
          <Receipt className="w-5 h-5" />
          <span className="text-xs">Claim</span>
        </Link>
        <Link href="/claims" className="flex flex-col items-center gap-1 px-4 py-1 text-gray-500 hover:text-blue-600">
          <FileText className="w-5 h-5" />
          <span className="text-xs">History</span>
        </Link>
        <LogoutButton className="flex flex-col items-center gap-1 px-4 py-1 text-gray-500 hover:text-red-600" />
      </nav>
    </div>
  )
}
