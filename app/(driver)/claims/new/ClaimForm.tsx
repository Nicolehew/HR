'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import type { Driver } from '@/lib/types'

const CLAIM_TYPES = [
  { value: 'meal', label: 'Meal Allowance', requiresReceipt: false },
  { value: 'toll', label: 'Toll / Parking', requiresReceipt: true },
  { value: 'other', label: 'Other', requiresReceipt: false },
]

export default function NewClaimPage() {
  const router = useRouter()
  const supabase = createClient()
  const [driver, setDriver] = useState<Driver | null>(null)
  const [type, setType] = useState('meal')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [amount, setAmount] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('drivers').select('*').eq('auth_id', user.id).single()
      setDriver(data)
    })
  }, [])

  const selectedType = CLAIM_TYPES.find(t => t.value === type)!

  async function submit() {
    if (!driver || !amount) return
    setLoading(true)
    setError('')

    let receiptUrl: string | null = null

    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Receipt must be an image file (JPG, PNG, etc.)')
        setLoading(false)
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Receipt image must be under 5 MB')
        setLoading(false)
        return
      }
      // Use a safe extension derived from MIME type, not the user-supplied filename
      const mimeToExt: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }
      const ext = mimeToExt[file.type] ?? 'jpg'
      const path = `${driver.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) {
        setError('Receipt upload failed. Please try again.')
        setLoading(false)
        return
      }
      receiptUrl = path
    }

    const { error: insertError } = await supabase.from('claims').insert({
      driver_id: driver.id,
      date,
      type,
      amount: parseFloat(amount),
      receipt_url: receiptUrl,
    })

    if (insertError) {
      setError('Could not submit claim. Please try again.')
    } else {
      setSuccess(true)
      setTimeout(() => router.push('/claims'), 1500)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-20 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900">Claim Submitted</h2>
        <p className="text-gray-500 mt-1">Redirecting to your claims…</p>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Submit Allowance Claim</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Claim Type</label>
          <div className="grid grid-cols-3 gap-2">
            {CLAIM_TYPES.map(t => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${
                  type === t.value
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            max={format(new Date(), 'yyyy-MM-dd')}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount (RM)</label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">RM</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="flex-1 rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Receipt {selectedType.requiresReceipt ? <span className="text-red-500">*</span> : <span className="text-gray-400">(optional)</span>}
          </label>
          <label className="flex flex-col items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 transition-colors">
            {file ? (
              <span className="text-sm text-blue-600 font-medium">{file.name}</span>
            ) : (
              <>
                <span className="text-2xl">📷</span>
                <span className="text-sm text-gray-500">Tap to attach photo</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={submit}
          disabled={loading || !amount || (selectedType.requiresReceipt && !file)}
          className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Submitting…' : 'Submit Claim'}
        </button>
      </div>
    </div>
  )
}
