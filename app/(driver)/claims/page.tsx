export const dynamic = 'force-dynamic'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import type { Claim, Driver } from '@/lib/types'

const TYPE_LABELS: Record<string, string> = {
  meal: 'Meal', toll: 'Toll', dental: 'Dental', medical: 'Medical', other: 'Other',
}

export default async function ClaimsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: driver } = await supabase.from('drivers').select('*').eq('auth_id', user.id).single() as { data: Driver | null }
  if (!driver) redirect('/login')

  const { data: claims } = await supabase
    .from('claims')
    .select('*')
    .eq('driver_id', driver.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">My Claims</h1>
        <Link href="/claims/new" className="text-sm text-blue-600 font-medium">+ New</Link>
      </div>

      {!claims?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-sm">No claims yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(claims as Claim[]).map(claim => (
            <div key={claim.id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">{TYPE_LABELS[claim.type]}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      claim.status === 'approved'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {claim.status === 'approved' ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{format(new Date(claim.date), 'd MMM yyyy')}</p>
                  {claim.status === 'rejected' && claim.rejection_reason && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 rounded px-2 py-1">
                      Reason: {claim.rejection_reason}
                    </p>
                  )}
                </div>
                <span className="text-base font-bold text-gray-900">RM {claim.amount.toFixed(2)}</span>
              </div>
              {claim.receipt_url && (
                <p className="text-xs text-blue-600 mt-2">📎 Receipt attached</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
