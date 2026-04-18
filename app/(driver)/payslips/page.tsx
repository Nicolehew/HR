export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Driver, PayrollSnapshot } from '@/lib/types'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default async function PayslipsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: driver } = await supabase.from('drivers').select('*').eq('auth_id', user.id).single() as { data: Driver | null }
  if (!driver) redirect('/login')

  const { data: snapshots } = await supabase
    .from('payroll_snapshots')
    .select('*')
    .eq('driver_id', driver.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <h1 className="text-xl font-bold text-gray-900 mb-6">My Payslips</h1>

      {!snapshots?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📄</p>
          <p className="text-sm">No payslips generated yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(snapshots as PayrollSnapshot[]).map(s => (
            <div key={s.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{MONTHS[s.month - 1]} {s.year}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.days_worked} days · {s.ot_hours.toFixed(1)}h OT</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">RM {s.gross_pay.toFixed(2)}</p>
                  {s.payslip_pdf_url ? (
                    <a
                      href={`/api/payslip/${s.id}`}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Download PDF
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">PDF pending</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
