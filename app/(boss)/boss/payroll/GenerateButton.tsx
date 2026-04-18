'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function GenerateButton({ month, year, driverIds }: { month: number; year: number; driverIds: string[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function generate() {
    setLoading(true)
    setError('')
    const res = await fetch('/api/payroll/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month, year, driverIds }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Generation failed')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={generate}
        disabled={loading}
        className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Generating PDFs…' : 'Generate Payslips'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
