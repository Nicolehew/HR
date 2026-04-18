import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import RejectButton from './RejectButton'
import type { Claim, Driver } from '@/lib/types'

export const revalidate = 0

const TYPE_LABELS: Record<string, string> = {
  meal: 'Meal', toll: 'Toll', dental: 'Dental', medical: 'Medical', other: 'Other',
}

export default async function BossClaimsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; driver_id?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const statusFilter = params.status ?? 'all'
  const driverFilter = params.driver_id ?? ''

  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, name')
    .eq('active', true)
    .eq('role', 'driver')
    .order('name')

  let query = supabase
    .from('claims')
    .select('*, drivers(name)')
    .order('created_at', { ascending: false })

  if (statusFilter !== 'all') query = query.eq('status', statusFilter)
  if (driverFilter) query = query.eq('driver_id', driverFilter)

  const { data: claims } = await query

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Claims Review</h1>

      {/* Filters */}
      <form className="flex gap-3 mb-6 flex-wrap">
        <select name="status" defaultValue={statusFilter} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="all">All statuses</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select name="driver_id" defaultValue={driverFilter} className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
          <option value="">All drivers</option>
          {(drivers as Pick<Driver, 'id' | 'name'>[] ?? []).map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <button type="submit" className="bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700">Filter</button>
      </form>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Driver</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Type</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Receipt</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {(claims ?? []).map((claim: Claim & { drivers: { name: string } }) => (
              <tr key={claim.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{claim.drivers?.name}</td>
                <td className="px-4 py-3 text-gray-600">{format(new Date(claim.date), 'd MMM yyyy')}</td>
                <td className="px-4 py-3 text-gray-600">{TYPE_LABELS[claim.type]}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">RM {claim.amount.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {claim.receipt_url ? (
                    <span className="text-blue-600 text-xs">📎 View</span>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    claim.status === 'approved'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}>
                    {claim.status}
                  </span>
                  {claim.status === 'rejected' && claim.rejection_reason && (
                    <p className="text-xs text-gray-400 mt-0.5 max-w-[160px] truncate">{claim.rejection_reason}</p>
                  )}
                </td>
                <td className="px-4 py-3">
                  {claim.status === 'approved' && <RejectButton claimId={claim.id} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!claims?.length && (
          <div className="text-center py-12 text-gray-400 text-sm">No claims found</div>
        )}
      </div>
    </div>
  )
}
