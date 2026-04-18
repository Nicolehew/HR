'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddDriverForm() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    password: '',
    base_salary: '3000',
    meal_rate: '15',
    ot_rate: '10',
    dental_allowance: '300',
    medical_allowance: '300',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function update(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function submit() {
    setLoading(true)
    setError('')

    const res = await fetch('/api/drivers/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        password: form.password,
        base_salary: parseFloat(form.base_salary),
        meal_rate: parseFloat(form.meal_rate),
        ot_rate: parseFloat(form.ot_rate),
        dental_allowance: parseFloat(form.dental_allowance),
        medical_allowance: parseFloat(form.medical_allowance),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Could not add driver.')
    } else {
      setSuccess(true)
      setForm({ name: '', phone: '', password: '', base_salary: '3000', meal_rate: '15', ot_rate: '10', dental_allowance: '300', medical_allowance: '300' })
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
        <input type="text" value={form.name} onChange={e => update('name', e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number</label>
        <div className="flex">
          <span className="inline-flex items-center px-2.5 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 text-xs">+60</span>
          <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="12-3456789"
            className="flex-1 rounded-r-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Login Password</label>
        <input type="text" value={form.password} onChange={e => update('password', e.target.value)}
          placeholder="e.g. their IC last 4 digits"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        <p className="text-xs text-gray-400 mt-1">Tell the driver this password — they use it to log in.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Base Salary (RM)', field: 'base_salary' },
          { label: 'Meal/day (RM)', field: 'meal_rate' },
          { label: 'OT/hr (RM)', field: 'ot_rate' },
          { label: 'Dental/mo (RM)', field: 'dental_allowance' },
          { label: 'Medical/mo (RM)', field: 'medical_allowance' },
        ].map(({ label, field }) => (
          <div key={field}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
            <input type="number" value={form[field as keyof typeof form]} onChange={e => update(field, e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">Driver added successfully!</p>}

      <button
        onClick={submit}
        disabled={loading || !form.name || !form.phone || !form.password}
        className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Adding…' : 'Add Driver'}
      </button>
    </div>
  )
}
