'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import type { Attendance, Driver } from '@/lib/types'

function useDriver() {
  const [driver, setDriver] = useState<Driver | null>(null)
  const supabase = createClient()
  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('drivers').select('*').eq('auth_id', user.id).single()
      setDriver(data)
    })
  }, [])
  return driver
}

export default function AttendancePage() {
  const supabase = createClient()
  const driver = useDriver()
  const [attendance, setAttendance] = useState<Attendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(new Date())
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!driver) return
    supabase
      .from('attendance')
      .select('*')
      .eq('driver_id', driver.id)
      .eq('date', todayStr)
      .maybeSingle()
      .then(({ data }) => setAttendance(data))
  }, [driver])

  async function getPosition(): Promise<GeolocationPosition | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return }
      navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { timeout: 5000 })
    })
  }

  async function clockIn() {
    if (!driver) return
    setLoading(true)
    const pos = await getPosition()
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        driver_id: driver.id,
        date: todayStr,
        clock_in_at: new Date().toISOString(),
        clock_in_lat: pos?.coords.latitude ?? null,
        clock_in_lng: pos?.coords.longitude ?? null,
      })
      .select()
      .single()
    if (!error) setAttendance(data)
    setLoading(false)
  }

  async function clockOut() {
    if (!driver || !attendance) return
    setLoading(true)
    const pos = await getPosition()
    const { data, error } = await supabase
      .from('attendance')
      .update({
        clock_out_at: new Date().toISOString(),
        clock_out_lat: pos?.coords.latitude ?? null,
        clock_out_lng: pos?.coords.longitude ?? null,
      })
      .eq('id', attendance.id)
      .select()
      .single()
    if (!error) setAttendance(data)
    setLoading(false)
  }

  const clockedIn = !!attendance?.clock_in_at
  const clockedOut = !!attendance?.clock_out_at

  function shiftDuration() {
    if (!attendance?.clock_in_at) return null
    const end = attendance.clock_out_at ? new Date(attendance.clock_out_at) : now
    const diffMs = end.getTime() - new Date(attendance.clock_in_at).getTime()
    const h = Math.floor(diffMs / 3_600_000)
    const m = Math.floor((diffMs % 3_600_000) / 60_000)
    const s = Math.floor((diffMs % 60_000) / 1000)
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 flex flex-col items-center gap-6">
      <div className="text-center">
        <p className="text-sm text-gray-500">{format(now, 'EEEE, d MMMM yyyy')}</p>
        <p className="text-4xl font-mono font-bold text-gray-900 mt-1">{format(now, 'HH:mm:ss')}</p>
      </div>

      {/* Shift timer */}
      {clockedIn && (
        <div className="w-full bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Shift Duration</p>
          <p className="text-3xl font-mono font-semibold text-gray-900">{shiftDuration()}</p>
          <div className="flex justify-center gap-6 mt-3 text-sm text-gray-500">
            <div>
              <span className="text-xs block text-gray-400">Clock In</span>
              {format(new Date(attendance!.clock_in_at), 'HH:mm')}
            </div>
            {clockedOut && (
              <div>
                <span className="text-xs block text-gray-400">Clock Out</span>
                {format(new Date(attendance!.clock_out_at!), 'HH:mm')}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main button */}
      {!clockedIn && (
        <button
          onClick={clockIn}
          disabled={loading}
          className="w-44 h-44 rounded-full bg-green-500 hover:bg-green-600 active:scale-95 text-white flex flex-col items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
        >
          <span className="text-4xl">▶</span>
          <span className="font-bold text-lg">{loading ? 'Loading…' : 'Clock In'}</span>
        </button>
      )}

      {clockedIn && !clockedOut && (
        <button
          onClick={clockOut}
          disabled={loading}
          className="w-44 h-44 rounded-full bg-red-500 hover:bg-red-600 active:scale-95 text-white flex flex-col items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50"
        >
          <span className="text-4xl">■</span>
          <span className="font-bold text-lg">{loading ? 'Loading…' : 'Clock Out'}</span>
        </button>
      )}

      {clockedOut && (
        <div className="w-44 h-44 rounded-full bg-gray-100 border-2 border-gray-200 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl">✓</span>
          <span className="font-bold text-gray-600">Shift Done</span>
          <span className="text-sm text-gray-400">{attendance?.hours_worked?.toFixed(1)}h</span>
        </div>
      )}

      <p className="text-xs text-gray-400 text-center">GPS location is recorded for reference only</p>
    </div>
  )
}
