import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { calculatePayroll } from '@/lib/payroll'
import GenerateButton from './GenerateButton'
import type { Driver, Attendance, Claim, PayrollSnapshot } from '@/lib/types'

export const revalidate = 0

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; year?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const month = parseInt(params.month ?? String(now.getMonth() + 1))
  const year = parseInt(params.year ?? String(now.getFullYear()))

  const monthStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')
  const monthEnd = format(endOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd')

  const { data: drivers } = await supabase
    .from('drivers')
    .select('*')
    .eq('active', true)
    .eq('role', 'driver')
    .order('name')

  const allDrivers = drivers as Driver[] ?? []

  const [{ data: allAttendance }, { data: allClaims }, { data: existingSnapshots }] = await Promise.all([
    supabase.from('attendance').select('*').in('driver_id', allDrivers.map(d => d.id)).gte('date', monthStart).lte('date', monthEnd),
    supabase.from('claims').select('*').in('driver_id', allDrivers.map(d => d.id)).gte('date', monthStart).lte('date', monthEnd),
    supabase.from('payroll_snapshots').select('*').in('driver_id', allDrivers.map(d => d.id)).eq('month', month).eq('year', year),
  ])

  const snapshotMap = new Map<string, PayrollSnapshot>(
    (existingSnapshots as PayrollSnapshot[] ?? []).map(s => [s.driver_id, s])
  )

  const rows = allDrivers.map(driver => {
    const driverAttendance = (allAttendance as Attendance[] ?? []).filter(a => a.driver_id === driver.id)
    const driverClaims = (allClaims as Claim[] ?? []).filter(c => c.driver_id === driver.id)
    const existing = snapshotMap.get(driver.id)
    // Always use calculatePayroll for display; snapshot is only used for PDF URL and locked state
    const calc = calculatePayroll(driver, driverAttendance, driverClaims)
    return { driver, calc, snapshot: existing ?? null }
  })

  const isLocked = rows.some(r => r.snapshot?.locked)
  const totalGross = rows.reduce((s, r) => s + r.calc.grossPay, 0)

  // Build month options: current month and last 11
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i)
    return { month: d.getMonth() + 1, year: d.getFullYear(), label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
  })

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
          <p className="text-sm text-gray-500">Total this month: <span className="font-semibold text-gray-900">RM {totalGross.toFixed(2)}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <form>
            <select name="month" defaultValue={month} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none mr-2">
              {monthOptions.map(o => (
                <option key={`${o.year}-${o.month}`} value={o.month}>{o.label.split(' ')[0]}</option>
              ))}
            </select>
            <input type="hidden" name="year" value={year} />
            <button type="submit" className="bg-gray-100 text-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-200">View</button>
          </form>
          {!isLocked && <GenerateButton month={month} year={year} driverIds={allDrivers.map(d => d.id)} />}
          {isLocked && <span className="text-xs text-gray-400 font-medium">Payslips generated ✓</span>}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-auto shadow-sm">
        <table className="w-full text-sm min-w-[900px]">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3 sticky left-0 bg-gray-50">Driver</th>
              <th className="text-right px-4 py-3">Days</th>
              <th className="text-right px-4 py-3">Total Hrs</th>
              <th className="text-right px-4 py-3">OT Hrs</th>
              <th className="text-right px-4 py-3">OT Pay</th>
              <th className="text-right px-4 py-3">Base</th>
              <th className="text-right px-4 py-3">Meal</th>
              <th className="text-right px-4 py-3">Toll</th>
              <th className="text-right px-4 py-3">Dental</th>
              <th className="text-right px-4 py-3">Medical</th>
              <th className="text-right px-4 py-3 font-bold text-gray-900">Gross</th>
              <th className="text-center px-4 py-3">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(({ driver, calc, snapshot }) => (
              <tr key={driver.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white">{driver.name}</td>
                <td className="px-4 py-3 text-right text-gray-600">{calc.daysWorked}</td>
                <td className="px-4 py-3 text-right text-gray-600">{calc.totalHours.toFixed(1)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={calc.otHours > 0 ? 'text-amber-600 font-semibold' : 'text-gray-400'}>
                    {calc.otHours.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">RM {calc.otPay.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">RM {driver.base_salary.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-gray-600">RM {calc.mealTotal.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">RM {calc.tollTotal.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">RM {calc.dentalAllowance.toFixed(2)}</td>
                <td className="px-4 py-3 text-right text-gray-600">RM {calc.medicalAllowance.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">RM {calc.grossPay.toFixed(2)}</td>
                <td className="px-4 py-3 text-center">
                  {snapshot?.payslip_pdf_url ? (
                    <a href={`/api/payslip/${snapshot.id}`} className="text-xs text-blue-600 hover:underline">PDF</a>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t border-gray-100">
            <tr>
              <td className="px-4 py-3 font-bold text-gray-900 sticky left-0 bg-gray-50" colSpan={10}>Total</td>
              <td className="px-4 py-3 text-right font-bold text-blue-600">RM {totalGross.toFixed(2)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
