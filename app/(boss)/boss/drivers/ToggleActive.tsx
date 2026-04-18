'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ToggleActive({ driverId, active }: { driverId: string; active: boolean }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    await supabase.from('drivers').update({ active: !active }).eq('id', driverId)
    setLoading(false)
    router.refresh()
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
        active
          ? 'bg-red-50 text-red-600 hover:bg-red-100'
          : 'bg-green-50 text-green-600 hover:bg-green-100'
      }`}
    >
      {loading ? '…' : active ? 'Deactivate' : 'Activate'}
    </button>
  )
}
