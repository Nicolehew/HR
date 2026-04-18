import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import type { Driver, Attendance } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function TodayPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const { data: drivers } = await supabase
    .from('drivers')
    .select('*')
    .eq('active', true)
    .eq('role', 'driver')
    .order('name')

  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('*')
    .eq('date', todayStr)

  const attendanceMap = new Map<string, Attendance>(
    (todayAttendance as Attendance[] ?? []).map(a => [a.driver_id, a])
  )

  const allDrivers = drivers as Driver[] ?? []
  const clockedIn = allDrivers.filter(d => {
    const a = attendanceMap.get(d.id)
    return a?.clock_in_at && !a.clock_out_at
  })
  const clockedOut = allDrivers.filter(d => {
    const a = attendanceMap.get(d.id)
    return !!a?.clock_out_at
  })
  const notIn = allDrivers.filter(d => !attendanceMap.has(d.id))

  function DriverCard({ driver }: { driver: Driver }) {
    const att = attendanceMap.get(driver.id)
    const isIn = att?.clock_in_at && !att.clock_out_at
    const isDone = !!att?.clock_out_at

    return (
      <div className={`rounded-xl border p-4 ${
        isIn ? 'bg-green-50 border-green-200' :
        isDone ? 'bg-gray-50 border-gray-200' :
        'bg-red-50 border-red-100'
      }`}>
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-900 text-sm">{driver.name}</p>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isIn ? 'bg-green-100 text-green-700' :
            isDone ? 'bg-gray-200 text-gray-600' :
            'bg-red-100 text-red-600'
          }`}>
            {isIn ? 'In' : isDone ? 'Done' : 'Absent'}
          </span>
        </div>
        {att && (
          <p className="text-xs text-gray-500 mt-1">
            In {format(new Date(att.clock_in_at), 'HH:mm')}
            {att.clock_out_at && ` · Out ${format(new Date(att.clock_out_at), 'HH:mm')}`}
            {att.hours_worked && ` · ${att.hours_worked.toFixed(1)}h`}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Today's Attendance</h1>
          <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, d MMMM yyyy')}</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium">{clockedIn.length} In</span>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">{clockedOut.length} Done</span>
          <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium">{notIn.length} Absent</span>
        </div>
      </div>

      {clockedIn.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Currently Clocked In ({clockedIn.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {clockedIn.map(d => <DriverCard key={d.id} driver={d} />)}
          </div>
        </section>
      )}

      {clockedOut.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Completed ({clockedOut.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {clockedOut.map(d => <DriverCard key={d.id} driver={d} />)}
          </div>
        </section>
      )}

      {notIn.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Not Clocked In ({notIn.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {notIn.map(d => <DriverCard key={d.id} driver={d} />)}
          </div>
        </section>
      )}
    </div>
  )
}
