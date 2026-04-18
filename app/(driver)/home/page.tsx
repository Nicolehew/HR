export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns'
import Link from 'next/link'
import { calculateOT } from '@/lib/payroll'
import type { Attendance, Claim, Driver } from '@/lib/types'

function WeekBar({ hours }: { hours: number }) {
  const pct = Math.min((hours / 40) * 100, 100)
  const isOT = hours > 40
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>This week</span>
        <span className={isOT ? 'text-amber-600 font-semibold' : ''}>{hours.toFixed(1)}h / 40h</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isOT ? 'bg-amber-500' : 'bg-blue-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {isOT && (
        <p className="text-xs text-amber-600 mt-1">{(hours - 40).toFixed(1)}h OT this week</p>
      )}
    </div>
  )
}

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: driver } = await supabase
    .from('drivers')
    .select('*')
    .eq('auth_id', user.id)
    .single() as { data: Driver | null }

  if (!driver) redirect('/login')

  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd')
  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')
  const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd')

  const [{ data: todayAttendance }, { data: weekAttendance }, { data: monthAttendance }, { data: monthClaims }] =
    await Promise.all([
      supabase.from('attendance').select('*').eq('driver_id', driver.id).eq('date', todayStr).maybeSingle(),
      supabase.from('attendance').select('*').eq('driver_id', driver.id).gte('date', weekStart).lte('date', weekEnd),
      supabase.from('attendance').select('*').eq('driver_id', driver.id).gte('date', monthStart).lte('date', monthEnd),
      supabase.from('claims').select('*').eq('driver_id', driver.id).gte('date', monthStart).lte('date', monthEnd).eq('status', 'approved'),
    ])

  const att = todayAttendance as Attendance | null
  const clockedIn = !!att?.clock_in_at
  const clockedOut = !!att?.clock_out_at

  let statusLabel = 'Not Clocked In'
  let statusColor = 'bg-red-50 text-red-700 border-red-200'
  if (clockedIn && !clockedOut) { statusLabel = 'Clocked In'; statusColor = 'bg-green-50 text-green-700 border-green-200' }
  if (clockedOut) { statusLabel = 'Shift Complete'; statusColor = 'bg-gray-50 text-gray-700 border-gray-200' }

  const weekHours = (weekAttendance as Attendance[] ?? []).reduce((s, a) => s + (a.hours_worked ?? 0), 0)
  const { otHours, otPay } = calculateOT(monthAttendance as Attendance[] ?? [], driver.ot_rate)
  const completedDays = (monthAttendance as Attendance[] ?? []).filter(a => a.clock_out_at).length
  const mealTotal = (monthClaims as Claim[] ?? []).filter(c => c.type === 'meal').reduce((s, c) => s + c.amount, 0)
  const tollTotal = (monthClaims as Claim[] ?? []).filter(c => c.type === 'toll').reduce((s, c) => s + c.amount, 0)
  const estimatedPay = driver.base_salary + otPay + mealTotal + tollTotal + driver.dental_allowance + driver.medical_allowance

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{format(today, 'EEEE, d MMMM yyyy')}</p>
          <h1 className="text-xl font-bold text-gray-900">Hi, {driver.name.split(' ')[0]}</h1>
        </div>
        <div className={`text-xs font-medium px-3 py-1.5 rounded-full border ${statusColor}`}>
          {statusLabel}
        </div>
      </div>

      {/* Today shift */}
      {att && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Today</p>
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-400">Clock In</p>
              <p className="font-semibold text-gray-900">{format(new Date(att.clock_in_at), 'HH:mm')}</p>
            </div>
            {att.clock_out_at && (
              <>
                <div>
                  <p className="text-xs text-gray-400">Clock Out</p>
                  <p className="font-semibold text-gray-900">{format(new Date(att.clock_out_at), 'HH:mm')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Hours</p>
                  <p className="font-semibold text-gray-900">{att.hours_worked?.toFixed(1)}h</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Week hours bar */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
        <WeekBar hours={weekHours} />
      </div>

      {/* MTD earnings */}
      <div className="bg-blue-600 rounded-xl p-4 text-white shadow-sm">
        <p className="text-xs font-medium text-blue-200 uppercase tracking-wide mb-1">
          {format(today, 'MMMM')} Estimated Pay
        </p>
        <p className="text-3xl font-bold">RM {estimatedPay.toFixed(2)}</p>
        <div className="flex gap-4 mt-3 text-xs text-blue-200">
          <span>{completedDays} days</span>
          <span>{otHours.toFixed(1)}h OT</span>
          <span>RM {(mealTotal + tollTotal).toFixed(2)} allowances</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/attendance"
          className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm hover:border-blue-200 transition-colors"
        >
          <span className="text-2xl">{clockedIn && !clockedOut ? '🔴' : '🟢'}</span>
          <span className="text-sm font-medium text-gray-700">{clockedIn && !clockedOut ? 'Clock Out' : 'Clock In'}</span>
        </Link>
        <Link
          href="/claims/new"
          className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center gap-2 shadow-sm hover:border-blue-200 transition-colors"
        >
          <span className="text-2xl">📋</span>
          <span className="text-sm font-medium text-gray-700">Submit Claim</span>
        </Link>
      </div>
    </div>
  )
}
