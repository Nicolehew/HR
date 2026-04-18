'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function LogoutButton({ className }: { className?: string }) {
  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button onClick={logout} className={className}>
      <LogOut className="w-4 h-4" />
      <span>Logout</span>
    </button>
  )
}
