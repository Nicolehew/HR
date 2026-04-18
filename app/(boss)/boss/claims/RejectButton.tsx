'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function RejectButton({ claimId }: { claimId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  async function reject() {
    setLoading(true)
    await supabase
      .from('claims')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', claimId)
    setLoading(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-red-600 hover:text-red-700 font-medium"
      >
        Reject
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">Reject Claim</h3>
            <p className="text-sm text-gray-500 mb-4">Provide a reason — the driver will see this.</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Receipt unclear, duplicate claim…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:ring-2 focus:ring-red-400 outline-none"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setOpen(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={loading || !reason.trim()}
                className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Rejecting…' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
