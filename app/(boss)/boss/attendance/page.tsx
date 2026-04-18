import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, subDays } from 'date-fns'
import type { Attendance, Driver } from '@/lib/types'

export const revalidate = 0

export default async function BossAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ driver_id?: string; from?: string; to?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const driverFilter = params.driver_id ?? ''
  const from = params.from ?? format(subDays(new Date(), 30), 'yyyy-MM-dd')
  const to = params.to ?? format(new Date(), 'yyyy-MM-dd')

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, name')
    .eq('active', true)
    .eq('role', 'driver')
    .order('name')

  let query = supabase
    .from('attendance')
    .select('*, drivers(name)')
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: false })
    .order('clock_in_at', { ascending: false })

  if (driverFilter) query = query.eq('driver_id', driverFilter)

  const { data: rows } = await query

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Log</h1>

      <form className="flex gap-3 mb-6 flex-wrap items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Driver</label>
          <select name="driver_id" defaultValue={driverFilter} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">All drivers</option>
            {(drivers as Pick<Driver, 'id' | 'name'>[] ?? []).map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input type="date" name="from" defaultValue={from} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input type="date" name="to" defaultValue={to} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">Filter</button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Driver</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Clock In</th>
              <th className="text-left px-4 py-3">Clock Out</th>
              <th className="text-right px-4 py-3">Hours</th>
              <th className="text-left px-4 py-3">GPS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(rows ?? []).map((row: Attendance & { drivers: { name: string } }) => (
              <tr key={row.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.drivers?.name}</td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(row.date), 'd MMM yyyy')}</td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(row.clock_in_at), 'HH:mm')}</td>
                <td className="px-4 py-3 text-gray-600">
                  {row.clock_out_at ? format(new Date(row.clock_out_at), 'HH:mm') : <span className="text-amber-500 text-xs">Not clocked out</span>}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {row.hours_worked != null ? `${row.hours_worked.toFixed(1)}h` : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {row.clock_in_lat ? '📍' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows?.length && (
          <div className="text-center py-12 text-gray-400 text-sm">No attendance records found</div>
        )}
      </div>
    </div>
  )
}
