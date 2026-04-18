'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { phoneToEmail } from '@/lib/auth-helpers'

export default function LoginPage() {
  const supabase = createClient()
  const [role, setRole] = useState<'driver' | 'boss' | null>(null)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function login() {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password,
    })

    if (error || !data.user) {
      setError('Incorrect phone number or password.')
      setLoading(false)
      return
    }

    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('role')
      .eq('auth_id', data.user.id)
      .single()

    if (!driver) {
      setError(`Account not linked to a driver record. (${driverError?.message ?? 'not found'})`)
      setLoading(false)
      return
    }

    window.location.href = driver.role === 'boss' ? '/boss/today' : '/home'
  }

  // Role selection screen
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-10">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Payroll</h1>
            <p className="text-sm text-gray-500 mt-1">Who are you signing in as?</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setRole('driver')}
              className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:shadow-md active:scale-95"
            >
              <span className="text-4xl">🚗</span>
              <span className="font-semibold text-gray-800">Driver</span>
            </button>
            <button
              onClick={() => setRole('boss')}
              className="bg-white border-2 border-gray-200 hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center gap-3 transition-all hover:shadow-md active:scale-95"
            >
              <span className="text-4xl">💼</span>
              <span className="font-semibold text-gray-800">Boss</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Login form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-8 text-center">
          <div className="text-4xl mb-3">{role === 'driver' ? '🚗' : '💼'}</div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'driver' ? 'Driver Login' : 'Boss Login'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Sign in with your phone number</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">+60</span>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="12-3456789"
                className="flex-1 block w-full rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={login}
            disabled={loading || !phone || !password}
            className="w-full bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          <button
            onClick={() => { setRole(null); setError(''); setPhone(''); setPassword('') }}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  )
}
